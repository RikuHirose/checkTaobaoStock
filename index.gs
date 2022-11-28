function myFunction() {
  const sheet_names = [
    // "kbq-item-list",
    // "bc-item-list",
    "bb-item-list",
  ]

  for (const sheet_name of sheet_names) {
    checkSheet(sheet_name)
  }

}

function checkSheet(sheet_name) {
  const sheets = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = sheets.getSheetByName(sheet_name);

  var range = sheet.getRange('A2:C5');
  var values = range.getValues();
  var i = 2;

  for (const value of values) {
    var taobao_url = value[1]
    var shop_hanble = value[0]
    
    if(taobao_url.match('.*id=.*')) {
      var item_id = taobao_url.split('id=')[1].split('&')[0];
      console.log(item_id)
      const stockCheckCell = sheet.getRange(i,6);
      const stockJsonCell = sheet.getRange(i,5);
      stockCheckCell.insertCheckboxes('yes');
      
      if (!stockCheckCell.isChecked()) {
        const staySecond = 2
        Utilities.sleep(staySecond * 1000);
        var jsonData = fetchTaobaoAPI(item_id)
        stockJsonCell.setValue(jsonData.data.skus)

        if (!isTaobaoHasStock(item_id, jsonData)) {
          // chartwork or slack通知 + シートのチェックつける
          let message = shop_hanble + "の在庫が20個未満です。店舗にて在庫確認をお願いします \n" + " https://item.taobao.com/item.htm?id="+item_id
          sendToSlack(message, "#shopify運用");
          // sendToChatWork(message, "265092395");
          stockCheckCell.check();

          
        }
      }
    }
    i++;
  }
}

function fetchTaobaoAPI(item_id) {
  var url = "http://api.tmapi.top/taobao/item_detail?apiToken=XXXXX&item_id=" + item_id
    
  var json = UrlFetchApp.fetch(url).getContentText();
  var jsonData = JSON.parse(json);

  return jsonData
}

function isTaobaoHasStock(item_id, jsonData) {
  var min_stock_num = 20
  
  for (const sku of jsonData.data.skus) {
    if (sku.stock > min_stock_num) {
    } else {
      return false;
      break;
    }
  }

  return true;
}

function sendToChatWork(message, roomId) {
 
 // チャットを送信する用のURL
 let url = `https://api.chatwork.com/v2/rooms/${roomId}/messages` 
 let msg = "【TAOBAO在庫通知BOT】 \n" + message
 
 // チャット送信に使うオプション
 let options = {
   "method" : "post",
   "headers" : {
     'X-ChatWorkToken': "XXXXXXXXXXXXXXXX"
   },
   "payload" : {
     "body" : msg
   }
 }
 
 // ChatWorkに通知する
 UrlFetchApp.fetch(url, options)
}

function sendToSlack(body, channel) {
  var url = "https://hooks.slack.com/services/XXXX/XXXX/XXXX";
  var data = { "channel" : channel, "username" : "Googleフォーム Bot", "text" : body, "icon_emoji" : ":date: " };
  var payload = JSON.stringify(data);
  var options = {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : payload
  };
  var response = UrlFetchApp.fetch(url, options);
}