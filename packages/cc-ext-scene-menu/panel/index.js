// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  // html template for panel
  template: `
    <h2>custom context menu</h2>
    <hr />
    <div>State: <span id="label">--</span></div>
    <hr />
    <ui-button id="btn">Send To Main</ui-button>
    <hr />
    <ui-button id="write-file">Access File</ui-button>
  `,

  // element and variable binding
  $: {
    btn: '#btn',
    label: '#label',
    btnWriteFile: '#write-file',
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    this.$btn.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('cc-ext-scene-menu:on-context-menu');
    });

    const fs = require('fs');
    const configPath = './scene-menu-config.json';  // project root folder
    this.$btnWriteFile.addEventListener('confirm', () => {
      // todo: 
      let data = '{}';
      fs.writeFile(configPath, data, function(err) {
        if (err) {
          Editor.log(err);
          return;
        }

        Editor.Ipc.sendToMain('cc-ext-scene-menu:update-context-menu');
      });
    });

    fs.readFile(configPath, function(err, data) {
      if (err) {
        // file not exists
        return;
      }

      try {
        let conf = JSON.parse(data);
        // todo: display in DOM, shoule be an array of items
        Editor.log(`index.js read data: ${data}`);
      } catch (err) {

      } finally {

      }
    });
  },

  // register your ipc messages here
  messages: {
    'cc-ext-scene-menu:hello' (event) {
      this.$label.innerText = 'Hello!';
    }
  }
});