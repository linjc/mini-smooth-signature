<view class="index">
  <!-- 样例1 -->
  <view class="container1" wx:if="{{!fullScreen}}">
    <canvas
      type="2d"
      canvas-id="signature1"
      class="signature1"
      width="{{width1 * scale}}"
      height="{{height1 * scale}}"
      style="width:{{width1}}px;height:{{height1}}px;"
      disable-scroll="{{true}}"
      bindtouchstart="handleTouchStart1"
      bindtouchmove="handleTouchMove1"
      bindtouchcancel="handleTouchEnd1"
      bindtouchend="handleTouchEnd1"
    ></canvas>
    <view class="actions1">
      <button bindtap="handleClear1">
        Clear
      </button>
      <button bindtap="handleUndo1">
        Undo
      </button>
      <button bindtap="handleRedo1">
        Redo
      </button>
      <button bindtap="handlePreview1">
        View PNG
      </button>
      <button bindtap="handleColor1">
        Change Color
      </button>
      <button bindtap="handleFullScreen1">
        Full Screen
      </button>
    </view>
  </view>
  <!-- 样例2（伪全屏） -->
  <view class="container2" wx:if="{{fullScreen}}">
    <view class="actions2Wrap">
      <view class="actions2">
        <button bindtap="handleClear2">
          Clear
        </button>
        <button bindtap="handleUndo2">
          Undo
        </button>
        <button bindtap="handleRedo2">
          Redo
        </button>
        <button bindtap="handlePreview2">
          View PNG
        </button>
        <button bindtap="handleColor2">
          Change Color
        </button>
        <button bindtap="handleFullScreen2">
          Close Full Screen
        </button>
      </view>
    </view>
    <canvas
      type="2d"
      canvas-id="signature2"
      class="signature2"
      width="{{width2 * scale}}"
      height="{{height2 * scale}}"
      style="width:{{width2}}px;height:{{height2}}px;"
      disable-scroll="{{true}}"
      bindtouchstart="handleTouchStart2"
      bindtouchmove="handleTouchMove2"
      bindtouchcancel="handleTouchEnd2"
      bindtouchend="handleTouchEnd2"
    ></canvas>
    <!-- 伪全屏生成旋转图片canvas容器，不在页面上展示 -->
    <view style="width:0;height:0;overflow:hidden">
      <canvas
        canvas-id="signature3"
        style="width:{{height2}}px;height:{{height2}}px;"
      />
    </view>
  </view>
</view>
