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
      const { windowWidth, windowHeight, pixelRatio  } = wx.getSystemInfoSync();
      this.setData({
        width1: windowWidth - 30,
        height1: 200,
        width2: windowWidth - 80,
        height2: windowHeight - 50,
        scale: Math.max(pixelRatio || 1, 2),
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
    wx.createSelectorQuery().select('#signature1').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node;
      canvas.width = this.data.width1 * this.data.scale;
      canvas.height = this.data.height1 * this.data.scale;
      const ctx = canvas.getContext('2d');
      this.signature1 = new Signature(ctx, {
        width: this.data.width1,
        height: this.data.height1,
        scale: this.data.scale,
        bgColor: '#e9cb93',
        toDataURL: (type, quality) => canvas.toDataURL(type, quality),
        getImagePath: () => new Promise((resolve, reject) => {
          const img = canvas.createImage();
          img.onerror = reject;
          img.onload = () => resolve(img);
          img.src = canvas.toDataURL();
        })
      })
    })
  },

  // 样例2初始化（伪全屏）
  initSignature2() {
    wx.createSelectorQuery().select('#signature2').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node;
      this.canvas2 = canvas;
      canvas.width = this.data.width2 * this.data.scale;
      canvas.height = this.data.height2 * this.data.scale;
      const ctx = canvas.getContext('2d');
      this.signature2 = new Signature(ctx, {
        width: this.data.width2,
        height: this.data.height2,
        scale: this.data.scale,
        minWidth: 4,
        maxWidth: 10,
        bgColor: '#e9cb93',
        toDataURL: (type, quality) => canvas.toDataURL(type, quality),
        getImagePath: () => new Promise((resolve, reject) => {
          const img = canvas.createImage();
          img.onerror = reject;
          img.onload = () => resolve(img);
          img.src = canvas.toDataURL();
        })
      })
    })
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
    setTimeout(() => this.initSignature2(), 50)
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
      wx.showToast({ icon: 'none', title: '未签名' });
      return;
    }
    const dataURL = this.signature1.toDataURL();
    base64ToPath(dataURL).then(url => {
      url && wx.previewImage({
        current: 0,
        urls: [url],
      });
    });
  },

  /**
   * 样例2按钮事件
   */
  handleFullScreen2() {
    this.setData({ fullScreen: false })
    setTimeout(() =>  this.initSignature1(), 50)
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
      wx.showToast({ icon: 'none', title: '未签名' });
      return;
    }
    this.getRotateImage().then(url => {
      url && wx.previewImage({
        current: 0,
        urls: [url],
      });
    });
  },

   // 样例2伪全屏输出旋转图片
   async getRotateImage() {
    const dataURL = this.signature2.toDataURL();
    const url = await base64ToPath(dataURL);
    const ctx = wx.createCanvasContext('signature3');
    const width = this.signature2.width;
    const height = this.signature2.height;
    ctx.restore();
    ctx.save();
    ctx.translate(0, height);
    ctx.rotate(270 * Math.PI / 180);
    ctx.drawImage(url, 0, 0, width, height);
    ctx.draw();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'signature3',
          x: 0,
          y: height - width,
          width: height,
          height: width,
          success: res => resolve(res.tempFilePath),
          fail: reject,
        })
      }, 50)
    })
  }
});

// base64转本地
function base64ToPath(dataURL) {
  return new Promise((resolve, reject) => {
    const data = wx.base64ToArrayBuffer(dataURL.replace(/^data:image\/\w+;base64,/, ""));
    const filePath = `${wx.env.USER_DATA_PATH}/${Math.random().toString(32).slice(2)}.png`;
    wx.getFileSystemManager().writeFile({
      filePath,
      data,
      encoding: 'base64',
      success: () => resolve(filePath),
      fail: reject,
    });
  })
}