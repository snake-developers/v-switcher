<style lang="scss">
#h5 {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  top: 0;
  z-index: 10;
  background-color: #fff;
  transform: translateY(0);
  transition: transform 0.4s ease;

  &.active {
    transform: translateY(-120px);
  }

  .carousel {
    width: 100%;
    height: 120px;

    .c-item {
      display: block;
      height: 120px;
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
    }

    .v-switcher {
      &-header {
        &-wrap {
          box-sizing: border-box;
          position: absolute;
          right: 10px;
          bottom: 10px;
          height: 35px;
          z-index: 1;
          width: 150px;
          border-bottom: none;
        }

        &-item {
          margin-left: 8px;
          width: 18px;
          height: 18px;
          background-position: -855px -790px;
          background-image: url("../icons.png");
          border-bottom-width: 0;
          cursor: default;
          padding: 0;

          &.is-active {
            background-position: -855px -727px;
          }
        }
      }
    }
  }

  .content {
    height: 100%;
    box-sizing: border-box;

    .v-switcher-header-anchor {
      height: 2px;
      bottom: 0;
      background-color: palevioletred;
    }

    .ul-wrap {
      margin: 0;
      padding: 0;

      .hoz-wrap {
        width: 100%;
        height: 150px;
        overflow: hidden;
      }

      .item-wrap {
        display: inline-block;
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        height: 110%;
        padding-bottom: 10%;
        box-sizing: content-box;
        width: 100%;
        -webkit-overflow-scrolling: touch;

        .item {
          height: 150px;
          line-height: 150px;
          font-size: 24px;
          display: inline-block;
          text-align: center;
          padding: 0 10px;
          width: 120px;
          white-space: nowrap;
        }
      }
    }
  }

  .flow-loader-state {
    text-align: center;
    height: 40px;
    line-height: 40px;
  }
}
</style>

<template>
  <div id="h5" :class="{ 'active': isActive }">
    <!--
    <div class="carousel">
      <v-switcher :headers="headers1" :swipe="true" :autoplay="2000" align="end" :header-height="18">
        <a
          v-for="(item, index) in headers1"
          :key="index"
          :slot="`${index}`"
          :style="{ backgroundColor: getRandomColor() }"
          class="c-item"
          href="javascript:;"
        >
          {{ item.title }}
        </a>
      </v-switcher>
    </div>
    -->
    <div class="content">
      <v-switcher
        :headers="headers2"
        :swipe="true"
        :sticky="true"
        :anchor-padding="20"
        @change="handleTabSwitch"
      >
        <template slot="header-before">
          <router-link to="/list">
            <button>筛选</button>
          </router-link>
        </template>
        <template slot="header-after">
          <button @click="handleBtnClick">筛选</button>
        </template>
        <v-scroller
          v-for="(item, index) in headers2"
          ref="scroll"
          :key="index"
          :event-step="30"
          :slot="`${index}`"
          @bottom="handleLoadMore"
        >
          <div class="ul-wrap">
            <flow-loader
              ref="loader"
              func="getListByPage"
              type="page"
              :auto="0"
              :query="{
                id: item,
                count: 10,
                index
              }"
              :callback="handleCallback"
            >
              <div slot-scope="{ flow }">
                <ItemComponent
                  v-for="(item, index) in flow"
                  :key="item.id"
                  :item="item"
                  :index="index"
                  :style="{ height: '110px' }"
                />
              </div>
            </flow-loader>
          </div>
        </v-scroller>
      </v-switcher>
    </div>
  </div>
</template>

<script>
import ItemComponent from '../Item'
import VScroller from 'h5-vue-scroller'

export default {
  name: 'Mobile',
  components: {
    VScroller,
    ItemComponent
  },
  data() {
    const headers2 = [
      'tab-0',
      'tab-1',
      'tab-5',
      'tab-9',
      'tab-4答',
      'tab-8奥术大',
      'tab-2奥术大师',
      'tab-乔斯达乔瑟夫',
      'tab-6阿斯达稍等',
      'tab-7乔斯达乔纳森',
    ]
    return {
      click: 0,
      ItemComponent,
      isActive: false,
      headers1: [
        {
          text: '',
          title: '成名必备！'
        },
        {
          text: '',
          title: '花泽香菜，甜美来袭！'
        },
        {
          text: '',
          title: '鸡鸣紫陌曙光寒，水转皇州春色阑'
        },
        {
          text: '',
          title: '请查收您的追番清单!'
        },
        {
          text: '',
          title: '欢迎来到天生制造狂的世界'
        }
      ],
      headers2,
      activeIndex: 0
    }
  },
  methods: {
    getRandomColor() {
      var colors = [
        'rgba(21,174,103,.5)',
        'rgba(245,163,59,.5)',
        'rgba(255,230,135,.5)',
        'rgba(194,217,78,.5)',
        'rgba(195,123,177,.5)',
        'rgba(125,205,244,.5)'
      ]
      return colors[~~(Math.random() * colors.length)]
    },
    handleTabSwitch(index) {
      console.log('handleTabSwitch', index)
      this.activeIndex = index
      this.$nextTick(() => {
        this.$refs.loader[index].initData()
      })
    },
    handleLoadMore() {
      this.$refs.loader[this.activeIndex].loadMore()
    },
    handleBtnClick() {
      alert('筛选')
    },
    handleCallback(data) {
      console.log('callback', data)
    }
  }
}
</script>
