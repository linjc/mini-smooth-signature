import Signature from 'mini-smooth-signature';

Component({
  data: {
    width: 300,
    height: 150,
    scale: 2,
  },
  props: {
    onSetFullScreen: () => { },
  },
  didMount() {
    try {
      const systemInfo = my.getSystemInfoSync();
      this.setData({
        width: systemInfo.windowWidth - 30,
        height: 200,
        scale: Math.max(systemInfo.pixelRatio || 1, 2),
      })
    } catch (e) { }
    this.initSignature()
  },
  methods: {
    // 初始化
    initSignature() {
      const ctx = my.createCanvasContext('signature');
      this.signature = new Signature(ctx, {
        width: this.data.width,
        height: this.data.height,
        scale: this.data.scale,
        bgColor: '#e9cb93',
        getImagePath: () => {
          return new Promise((resolve) => {
            ctx.toTempFilePath({
              success: res => resolve(res.apFilePath),
            })
          })
        }
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
      this.props.onSetFullScreen(true);
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
      this.signature.ctx.toTempFilePath({
        success: res => {
          console.log(res)
          const url = res.apFilePath;
          url && my.previewImage({
            current: 0,
            urls: [url],
          });
        },
      })
    },
  },
});