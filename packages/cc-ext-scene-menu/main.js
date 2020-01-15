'use strict';

module.exports = {
  injectContextMenu(webContents) {
    if (webContents.__gt_injected) {
      // already injected
      return;
    }

    if (webContents != Editor.Window.main.nativeWin.webContents) {
      // not cc main app window
      return;
    }
    webContents.__gt_injected = true;

    let hackCode = `
      (() => {
        function appendListener(node, eventType, fn = null) {
          node.addEventListener(eventType, (e) => {
            if (fn)	fn(e);
          });		
        }
      
        let getLabelRoot = (gridRoot, className) => {
          for (let c of gridRoot.children) {
            if (c.className === className)
              return c;
          }
      
          return null;
        };
      
        let getPixel = (elem) => {
          return parseFloat(elem.style.transform.match(/(-?[0-9\.]+)/g)[0]);
        };
      
        let getWorldPos = (elem) => {
          return parseFloat(elem.innerText.replace(/,/g, ''));
        };
      
        let pixelToWorld = (labelRoot, pixel) => {
          let pmin = getPixel(labelRoot.firstChild);
          let pmax = getPixel(labelRoot.lastChild);
          let wmin = getWorldPos(labelRoot.firstChild);
          let wmax = getWorldPos(labelRoot.lastChild);
          return (pixel - pmin) * (wmax - wmin) / (pmax - pmin) + wmin;
        };
      
        let svgPosToWorld = (x, y) => {
          let gridRoot = document.getElementById('scene').shadowRoot.getElementById('sceneView').shadowRoot.getElementById('grid').shadowRoot;
          let vLabelRoot = getLabelRoot(gridRoot, 'vLabels');
          let hLabelRoot = getLabelRoot(gridRoot, 'hLabels');
          let worldX = pixelToWorld(hLabelRoot, x);
          let worldY = pixelToWorld(vLabelRoot, y);
          return [worldX, worldY];
        };
      
        let svgNode = null;
        let downX = 0;
        let downY = 0;
        let isDown = false;
        appendListener(document, 'contextmenu', (e) => {
          // check if inside svg view
          if (!svgNode)
            svgNode = document.getElementById('scene').shadowRoot.getElementById('sceneView').shadowRoot.getElementById('gizmosView').shadowRoot.getElementById('SvgjsSvg1000');
          
          if (!svgNode) {
            Editor.log('svg view not ready');
            return;
          }
      
          let rect = svgNode.getBoundingClientRect();
          if (e.pageX >= rect.left && e.pageX < rect.right && e.pageY >= rect.top && e.pageY < rect.bottom) {
            downX = e.pageX;
            downY = e.pageY;
            isDown = true;
          }
        });
      
        appendListener(document, 'mouseup', (e) => {
          if (isDown && e.pageX == downX && e.pageY == downY) {
            isDown = false;

            let rect = svgNode.getBoundingClientRect();
            downX -= rect.left;
            downY -= rect.top;
            let worldX = 0;
            let worldY = 0;
            try {
              let arr = svgPosToWorld(downX, downY);
              worldX = arr[0];
              worldY = arr[1];
            } catch(error) {}

            Editor.Ipc.sendToMain('cc-ext-scene-menu:on-context-menu', 
              {x: downX, y: downY, worldX: worldX, worldY: worldY}, null, 1);
          }
        });
      })();

      1+2+3
    `;

    // hackCode = `
    //   Editor.log('ok im in ');
    //   console.log('ok im in ');
    //   10+14
    // `;
    webContents.executeJavaScript(hackCode, function(result) {
      // do nothing
    });
  },

  load () {
    try {
      if (Editor.Window.main.nativeWin.webContents.__gt_injected) {
        // in case plugin if reloaded
        return;
      }
    } catch(error) {
      Editor.log(error);
      // usually happen when creator is just started and main window is not created
    }

    // todo: 如果插件是中途加载的，判断webContents如果就绪了就注入
    const electron = require('electron');
    let injectFn = this.injectContextMenu;
    electron.app.on('web-contents-created', (sender, webContents) => {
      webContents.on('dom-ready', (e) => {
        injectFn(e.sender);
      });
    });
  },

  unload () {
    // let webContenst = Editor.Window.main.nativeWin.webContents;
    // if (webContenst.__gt_injected) {
    //     // todo: removeEventListeners
    //     webContenst.__gt_injected = false;
    // }
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'create-node' () {
      Editor.Scene.callSceneScript('cc-ext-scene-menu', 'create-node', null, function (err) {
        // Editor.log('create-enemy finish');
      });
    },
    'on-context-menu' (event, param) {
      // todo: 从配置中加载菜单
      // 标准项：菜单名字、prefabuuid。支持创建为选中物体的子对象
      // 扩展项：自定义方法。通过ipc消息发送，带参数，参数中注入坐标。需要用户新建插件
      var template = [
        {
          label: 'create-node',
          click: (e) => {
            Editor.Scene.callSceneScript('cc-ext-scene-menu', 'create-node', param, (err) => {

            });
          }
        }
      ];

      Editor.Window.main.popupMenu(template, param.x, param.y);
    }
    // 'say-hello' (event) {
    //   this.injectContextMenu(Editor.Window.main.nativeWin.webContents);

    //   // send ipc message to panel
    //   // Editor.Scene.callSceneScript('cc-ext-scene-menu', 'hello');
    //   // Editor.Ipc.sendToPanel('cc-ext-scene-menu', 'cc-ext-scene-menu:hello');
    // }
  },
};