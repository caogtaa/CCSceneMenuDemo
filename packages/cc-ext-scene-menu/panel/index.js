// panel/index.js, this filename needs to match the one registered in package.json

let _config = {};
Editor.Panel.extend({
  // css style for panel

  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }

    ul {
      list-style-type: none;
    }

    ul li {
      padding: 2px 10px 1px 0;
      text-align: -webkit-match-parent;
      color: #ccc;
      border-bottom: 1px solid #454545;
      box-sizing: border-box;
    }

    span.selected {
      background: #555;
    }

    .caret {
      cursor: pointer;
      -webkit-user-select: none; /* Safari 3.1+ */
      -moz-user-select: none; /* Firefox 2+ */
      -ms-user-select: none; /* IE 10+ */
      user-select: none;
    }
    
    .caret::before {
      content: "\\25B6";
      color: #ccc;
      display: inline-block;
      margin-right: 6px;
    }
    
    .caret-down::before {
      -ms-transform: rotate(90deg); /* IE 9 */
      -webkit-transform: rotate(90deg); /* Safari */'
      transform: rotate(90deg);  
    }
    
    .nested {
      display: none;
    }
    
    .active {
      display: block;
    }
  `,

  // html template for panel
  template: `
    <h2>custom context menu</h2>
    <hr />
    <div v-if="loaded">
      <ul>
        <li>
          <span class="caret caret-down" v-on:click="toggleCaret"></span>
          <span v-bind:class="{ selected: focus_item==null }" v-on:click="focus_item=null;">context menu</span>
          <ul class="nested active">
            <li v-for="c in config">
              <span v-if="c.type == 2 && c.submenu && c.submenu.length > 0" class="caret" v-on:click="toggleCaret"></span>
              <span v-bind:class="{ selected: focus_item==c }" v-on:click="focus_item=c;">{{c.name}}</span>
              <ul class="nested">
                <li v-for="subc in c.submenu">
                  <span v-bind:class="{ selected: focus_item==c }" v-on:click="focus_item=c;">{{subc.name}}</span>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>

      <ui-box-container v-if="focus_item">
        <ui-input v-value="focus_item.name" placeholder="menu display name"></ui-input>
        <ui-select v-value="focus_item.type">
          <option value="0">prefab</option>
          <option value="1">command</option>
          <option value="2">sub menu</option>
        </ui-select>
        <ui-input v-if="focus_item.type=='0'" v-value="focus_item.uuid" placeholder="prefab uuid"></ui-input>
        <ui-input v-if="focus_item.type=='1'" v-value="focus_item.method" placeholder="your plugin method"></ui-input>
        <ui-input v-if="focus_item.type=='1'" v-value="focus_item.param" placeholder="parameter(string)"></ui-input>
      </ui-box-container>
    </div>
    <ui-section v-if="false">
      <div class="header">config section</div>
      <div class="row" v-for="c in config">
        <ui-input v-value="c.name" placeholder="menu display name"></ui-input>
        <ui-select v-value="c.type">
          <option value="0">prefab</option>
          <option value="1">command</option>
          <option value="2">sub menu</option>
        </ui-select>
        <ui-input v-if="c.type=='0'" v-value="c.uuid" placeholder="prefab uuid"></ui-input>
        <ui-input v-if="c.type=='1'" v-value="c.method" placeholder="your plugin method"></ui-input>
        <ui-input v-if="c.type=='1'" v-value="c.param" placeholder="parameter(string)"></ui-input>
      </div>

      <ui-button id="save" @confirm="onSaveConfirm">Save</ui-button>
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
    const fs = require('fs');
    const configPath = './scene-menu-config.json';  // project root folder
    // this.$btnSave.addEventListener('confirm', () => {
    //    saveConfig();
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
          focus_item: null,
          message: 'hello',
          loaded: true
        },
        methods: {
          onSaveConfirm (event) {
            event.stopPropagation();
            saveConfig();
          },
          toggleCaret (event) {
            event.target.classList.toggle('caret-down');
            event.target.parentElement.querySelector(".nested").classList.toggle("active");
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
