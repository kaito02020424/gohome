# gohome Add-on
シンプルなgohomeアドオンです。

## Commands
 - `!gohome <名前>`  
 ex) `!gohome myhome`  
 指定した場所にテレポートします
 - `!sethome <名前>`  
 ex) `!sethome myhome`  
 現在地を指定した名前として登録し, gohomeできるようにします
 - `!delhome <名前>`
 ex) `!delhome myhome`  
 指定した名前の地点を削除します
 - `!listhome`
 自分の登録したhome一覧を表示します

## Configs

`scripts/gohome`配下の`config.js`を編集し, 設定を変更できます
### Default settings
```json
{
    "max_home":5,
    "dimension": {
        "overworld":true,
        "nether":true,
        "the_end":false
    }
}

```

### keys
 - max_home: 1人あたりが登録可能なホーム数
 - dimension: それぞれのディメンションでの`!gohome`登録を許可するか
   - これには, エンドゲートの希少性などを考慮してバランスを考える必要があります
