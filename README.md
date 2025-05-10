
   ```
   a = jsonq(jsonObj).gather("complexContent/extension/sequence/element")
                     .where((e)=> e.get('name') === "tim").items;
   a[0].get('address');
   ```

