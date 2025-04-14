import Signature from 'mini-smooth-signature';

Component({
  mixins: [],
  data: {
    width: 300,
    height: 600,
    scale: 2,
  },
  props: {
    onSetFullScreen: () => { },
  },
  didMount() {
    try {
      const systemInfo = my.getSystemInfoSync();
      this.setData({
        width: systemInfo.windowWidth - 80,
        height: systemInfo.windowHeight - 50,
        scale: Math.max(systemInfo.pixelRatio || 1, 2),
      })
    } catch (e) { }
    this.initSignature()
  },
  methods: {
    // 初始化签名
    initSignature() {
      const ctx = my.createCanvasContext('signature1');
      this.signature = new Signature(ctx, {
        width: this.data.width,
        height: this.data.height,
        scale: this.data.scale,
        minWidth: 3,
        maxWidth: 10,
        bgColor: '#e9cb93'
      });
    },
    // 绑定touchstart事件
    handleTouchStart(e) {
      const pos = e.touches[0];
      this.signature.onDrawStart(pos.x, pos.y);
    },
    // 绑定touchmove事件
    handleTouchMove(e) {
      const pos = e.touches[0];
      this.signature.onDrawMove(pos.x, pos.y);
    },
    // 绑定touchend/touchcancel事件
    handleTouchEnd() {
      this.signature.onDrawEnd();
    },

    /**
     * actions
     */
    handleFullScreen() {
      this.props.onSetFullScreen(false);
    },
    handleClear() {
      this.signature.clear();
    },
    handleUndo() {
      this.signature.undo();
    },
    handlePreview() {
      if (this.signature.isEmpty()) {
        my.showToast({ content: '未签名' });
        return;
      }
      this.getRotateImage().then(url => {
        url && my.previewImage({
          current: 0,
          urls: [url],
        });
      });
    },

    // 输出旋转图片
    getRotateImage() {
      return new Promise((resolve, reject) => {
        this.signature.ctx.toTempFilePath({
          success: res => {
            const url = res.apFilePath;
            const ctx2 = my.createCanvasContext('signature2');
            const width = this.signature.width;
            const height = this.signature.height;
            ctx2.restore();
            ctx2.save();
            ctx2.translate(0, height);
            ctx2.rotate(270 * Math.PI / 180);
            ctx2.drawImage(url, 0, 0, width, height);
            ctx2.draw();
            setTimeout(() => {
              ctx2.toTempFilePath({
                x: 0,
                y: height - width,
                width: height,
                height: width,
                success: res => resolve(res.apFilePath),
                fail: reject,
              })
            }, 50)
          },
        })
      })
    }
  },
});