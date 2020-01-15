
function AttachNode(node, param, callback) {
  if (param.parentId) {
    // todo: world position to parent position
  } else {
    // let canvas = cc.director.getScene().children[0];
    // todo: canvas can be renamed
    let canvas = cc.find('Canvas');

    // todo: world position to canvas position
    node.x = param.worldX - canvas.width / 2;
    node.y = param.worldY - canvas.height / 2;
    canvas.addChild(node);
  }

  // todo: 加入undo列表，目前cc不支持
  if (callback) {
    callback(null, node);
  }
}

// load prefab by uuid, create instance under canvas or some parent node
function InsertNode(param, callback) {
  // Editor.log(`${param.x},${param.y},${param.worldX},${param.worldY}`);
  param = param || { worldX: 0, worldY: 0 };

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
        AttachNode(node, param, callback);
      }
    );
  } else {
    let node = new cc.Node();
    AttachNode(node, param, callback);
  }
}

// @ts-ignore
module.exports = {
  'create-node': function (event, param) {
    // Editor.log('call create-enemy');
    // todo: param.uuid being the prefab uuid, if not specified, create empty node
    // todo: param.parentId being the parent node id (not prefab uuid)

    // let nodeUUID = Editor.Selection.curSelection('node');
    // '60527f13-3456-4712-b9b6-ad2f3cb948b4', 
    // todo: test
    // param.uuid = '60527f13-3456-4712-b9b6-ad2f3cb948b4';
    // param.parentId = Editor.Selection.curSelection('node');
    InsertNode(param, (error, node) => {
      if (node) {
        Editor.log(`${node.name} created`);

        // select new node
        Editor.Selection.select('node', node.uuid);
      }

      if (event.reply) {
        event.reply(error);
      }
    });
  }
};
