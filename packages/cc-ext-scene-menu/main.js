'use strict';

let _menuTemplateCache = null;
let _paramCache = {};

function createNode(uuid) {
  let param = {uuid: uuid};
  Object.assign(param, _paramCache);
  Editor.Scene.callSceneScript('cc-ext-scene-menu', 'create-node', param, (err) => {
    if (err)
      Editor.log(err);
  });
}

function generateMenuTemplate(conf) {
  let result = [];
  for (let c of conf) {
    let item = {};
    item.label = c.name;

    // item.click = createNode.bind(c.uuid);
    // the menu item auto unbound my function, why?
    // so I put uuid in closure
    let uuid = c.uuid;
    item.click = () => {
      createNode(uuid);
    };
    
    result.push(item);
  }

  // var template = [
    //   {
    //     label: 'create-node',
    //     click: (e) => {
    //       Editor.Scene.callSceneScript('cc-ext-scene-menu', 'create-node', param, (err) => {
  
    //       });
    //     }
    //   }
    // ];

    // 标准项：菜单名字、prefabuuid。支持创建为选中物体的子对象
    // 扩展项：自定义方法。通过ipc消息发送，带参数，参数中注入坐标。需要用户新建插件
  return result;
}

function loadMenu() {
  const fs = require('fs');
  fs.readFile('./scene-menu-config.json', function(err, data) {
    if (err) {
      // file not exists
      return;
    }

    try {
      Editor.log(`main.js read data: ${data}`);
      let config = JSON.parse(data);
      _menuTemplateCache = generateMenuTemplate(config);
    } catch (err) {
      // if any error occur, old template cache is not replaced
    } finally {

    }
  });
}

function injectContextMenu(webContents) {
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
}

module.exports = {
  load () {
    loadMenu();
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
    let injectFn = injectContextMenu;
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
        // Editor.log('create-node finish');
      });
    },
    'on-context-menu' (event, param) {
      param = param || {x:0, y:0, worldX: 0, worldY: 0};
      _paramCache = param;
      if (_menuTemplateCache) {
        Editor.Window.main.popupMenu(_menuTemplateCache, param.x, param.y);
      }
    },
    'custom-context-menu' () {
      Editor.Panel.open('cc-ext-scene-menu')
    },
    'update-context-menu' () {
      loadMenu();
    }
    // 'say-hello' (event) {
    //   this.injectContextMenu(Editor.Window.main.nativeWin.webContents);

    //   // send ipc message to panel
    //   // Editor.Scene.callSceneScript('cc-ext-scene-menu', 'hello');
    //   // Editor.Ipc.sendToPanel('cc-ext-scene-menu', 'cc-ext-scene-menu:hello');
    //   // Editor.Ipc.sendToMain 
    //   // todo: 所有可能的方法 https://docs.cocos.com/creator/manual/zh/extension/ipc-workflow.html#%E5%85%B6%E4%BB%96%E6%B6%88%E6%81%AF%E5%8F%91%E9%80%81%E6%96%B9%E6%B3%95
    // }
  },
};