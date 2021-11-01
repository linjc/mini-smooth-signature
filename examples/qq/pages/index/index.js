import Signature from 'mini-smooth-signature';

Page({
  data: {
    fullScreen: false,
    width1: 320,
    height1: 200,
    width2: 320,
    height2: 600,
    scale: 2,
  },
  onReady() {
    try {
      const systemInfo = qq.getSystemInfoSync();
      this.setData({
        width1: systemInfo.windowWidth - 30,
        height1: 200,
        width2: systemInfo.windowWidth - 80,
        height2: systemInfo.windowHeight - 50,
        scale: Math.max(systemInfo.pixelRatio || 1, 2),
      })
    } catch (e) { }
    if (this.data.fullScreen) {
      this.initSignature2();
    } else {
      this.initSignature1();
    }
  },

  // 样例1初始化
  initSignature1() {
    const ctx = qq.createCanvasContext('signature1');
    this.signature1 = new Signature(ctx, {
      width: this.data.width1,
      height: this.data.height1,
      scale: this.data.scale,
      bgColor: '#e9cb93',
      getImagePath: () => new Promise((resolve, reject) => {
        qq.canvasToTempFilePath({
          canvasId: 'signature1',
          success: res => resolve(res.tempFilePath),
          fail: reject
        })
      })
    })
    this.signature1.clear()
  },

  // 样例2初始化（伪全屏）
  initSignature2() {
    const ctx = qq.createCanvasContext('signature2');
    this.signature2 = new Signature(ctx, {
      width: this.data.width2,
      height: this.data.height2,
      scale: this.data.scale,
      minWidth: 4,
      maxWidth: 10,
      bgColor: '#e9cb93',
      getImagePath: () => new Promise((resolve, reject) => {
        qq.canvasToTempFilePath({
          canvasId: 'signature2',
          success: res => resolve(res.tempFilePath),
        })
      })
    })
    this.signature2.clear()
  },

  /**
   * 样例1事件绑定
   */
  handleTouchStart1(e) {
    const pos = e.touches[0];
    this.signature1.onDrawStart(pos.x, pos.y);
  },
  handleTouchMove1(e) {
    const pos = e.touches[0];
    this.signature1.onDrawMove(pos.x, pos.y);
  },
  handleTouchEnd1() {
    this.signature1.onDrawEnd();
  },

  /**
   * 样例2事件绑定
   */
  handleTouchStart2(e) {
    const pos = e.touches[0];
    this.signature2.onDrawStart(pos.x, pos.y);
  },
  handleTouchMove2(e) {
    const pos = e.touches[0];
    this.signature2.onDrawMove(pos.x, pos.y);
  },
  handleTouchEnd2() {
    this.signature2.onDrawEnd();
  },

  /**
   * 样例1按钮事件
   */
  handleFullScreen1() {
    this.setData({ fullScreen: true })
    setTimeout(() => this.initSignature2(), 100)
  },
  handleClear1() {
    this.signature1.clear();
  },
  handleUndo1() {
    this.signature1.undo();
  },
  handleColor1() {
    this.signature1.color = '#' + Math.random().toString(16).slice(-6);
  },
  handlePreview1() {
    if (this.signature1.isEmpty()) {
      qq.showToast({ icon: 'none', title: '未签名' });
      return;
    }
    qq.canvasToTempFilePath({
      canvasId: 'signature1',
      success: res => {
        res.tempFilePath && qq.previewImage({
          current: 0,
          urls: [res.tempFilePath],
        });
      },
    });
  },

  /**
   * 样例2按钮事件
   */
  handleFullScreen2() {
    this.setData({ fullScreen: false })
    setTimeout(() => this.initSignature1(), 100)
  },
  handleClear2() {
    this.signature2.clear();
  },
  handleUndo2() {
    this.signature2.undo();
  },
  handleColor2() {
    this.signature2.color = '#' + Math.random().toString(16).slice(-6);
  },
  handlePreview2() {
    if (this.signature2.isEmpty()) {
      qq.showToast({ icon: 'none', title: '未签名' });
      return;
    }
    qq.canvasToTempFilePath({
      canvasId: 'signature2',
      success: res => {
        res.tempFilePath && qq.previewImage({
          current: 0,
          urls: [res.tempFilePath],
        });
      },
    });
    // this.getRotateImage().then(url => {
    //   url && qq.previewImage({
    //     current: 0,
    //     urls: [url],
    //   });
    // });
  },

  // 样例2伪全屏输出旋转图片
  async getRotateImage() {
    return new Promise((resolve, reject) => {
      qq.canvasToTempFilePath({
        canvasId: 'signature2',
        success: res => {
          const url = res.tempFilePath;
          const ctx = qq.createCanvasContext('signature3');
          const width = this.signature2.width;
          const height = this.signature2.height;
          ctx.restore();
          ctx.save();
          ctx.translate(0, height);
          ctx.rotate(270 * Math.PI / 180);
          ctx.drawImage(url, 0, 0, width, height);
          ctx.draw();
          setTimeout(() => {
            qq.canvasToTempFilePath({
              canvasId: 'signature3',
              x: 0,
              y: height - width,
              width: height,
              height: width,
              success: res => resolve(res.tempFilePath),
              fail: reject
            })
          }, 50)
        },
      });
    });
  }
});