// panel/index.js, this filename needs to match the one registered in package.json

let _config = {};
Editor.Panel.extend({
  // css style for panel

  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  // html template for panel
  template: `
    <h2>custom context menu</h2>
    <ui-select value="0">
      <option value="0">prefab</option>
      <option value="1">command</option>
      <option value="2">sub menu</option>
    </ui-select>
    <hr />
    <ui-section v-if="loaded">
      <div class="header">config section</div>
      <div class="row" v-for="c in config">
        <ui-select v-value="c.type">
          <option value="0">prefab</option>
          <option value="1">command</option>
          <option value="2">sub menu</option>
        </ui-select>
        <ui-input v-value="c.name" placeholder="menu display name"></ui-input>
        <ui-input v-value="c.uuid" placeholder="prefab uuid"></ui-input>
      </div>

      <ui-button id="save" @confirm="onSaveConfirm">save</ui-button>
    </ui-section>
  `,

  // element and variable binding
  $: {
    // btn: '#btn',
    // label: '#label',
    // btnSave: '#save-config',
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    // this.$btn.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('cc-ext-scene-menu:on-context-menu');
    // });

    const fs = require('fs');
    const configPath = './scene-menu-config.json';  // project root folder
    // this.$btnSave.addEventListener('confirm', () => {
    //   Editor.log("222");
    //   let data = JSON.stringify(_config);
    //   fs.writeFile(configPath, data, function(err) {
    //     if (err) {
    //       Editor.log(err);
    //       return;
    //     }

    //     Editor.Ipc.sendToMain('cc-ext-scene-menu:update-context-menu');
    //   });
    // });

    let saveConfig = () => {
      let data = JSON.stringify(_config, null, 4);
      fs.writeFile(configPath, data, function(err) {
        if (err) {
          Editor.log(err);
          return;
        }

        Editor.Ipc.sendToMain('cc-ext-scene-menu:update-context-menu');
      });
    };

    let initWindow = (config) => {
      _config = config;
      new window.Vue({
        el: this.shadowRoot,
        data: {
          config: _config,
          message: 'hello',
          loaded: true
        },
        methods: {
          onSaveConfirm (event) {
            saveConfig();
          }
        }
      });
    };

    fs.readFile(configPath, function(err, data) {
      if (err) {
        // file not exists
        initWindow({});
        return;
      }

      let config = {};
      try {
        config = JSON.parse(data);
        // Editor.log(`index.js read data: ${data}`);
      } catch (err) {

      } finally {
        initWindow(config);
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