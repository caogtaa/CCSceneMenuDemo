
function AttachNode(node, parent, worldPos, callback) {
  // world position to relative position
  parent.addChild(node);
  node.position = parent.convertToNodeSpaceAR(worldPos);

  // todo: 加入undo列表，目前cc不支持
  if (callback) {
    callback(null, node);
  }
}

// load prefab by uuid, create instance under canvas or some parent node
function InsertNode(param, callback) {
  param = param || { worldX: 0, worldY: 0 };
  let worldPos = cc.v2(param.worldX, param.worldY);   // todo: uniform param

  let parent = null;
  if (param.parentId) {
    parent = cc.engine.getInstanceById(param.parentId);
  } else {
    // let canvas = cc.director.getScene().children[0];
    // todo: canvas can be renamed
    parent = cc.find('Canvas');;
  }

  if (!parent) {
    if (callback)
      callback('parent node not found, cancel.', null);

    return;
  }

  if (param.uuid) {
    cc.loader.load(
      { uuid: param.uuid, type: 'uuid' },
      null,
      function (error, prefab) {
        if (error) {
          Editor.log(error);
          if (callback) {
            callback(error, null);
          }
          return;
        }

        let node = cc.instantiate(prefab);
        AttachNode(node, parent, worldPos, callback);
      }
    );
  } else {
    let node = new cc.Node();
    AttachNode(node, parent, worldPos, callback);
  }
}

// @ts-ignore
module.exports = {
  'create-node': function (event, param) {
    let selected = Editor.Selection.curSelection('node');
    if (selected.length > 0) {
      param.parentId = selected[0];
    }

    InsertNode(param, (error, node) => {
      if (node) {
        // select new node
        Editor.Selection.select('node', node.uuid);
        Editor.log(`'${node.name}' created`);
      }

      if (event.reply) {
        event.reply(error);
      }
    });
  }
};
