
   ...
   import { XMLParser } from 'fast-xml-parser';

   const parser = new XMLParser({...});
   let jsonObj = parser.parse(...);

   a = jsonq(jsonObj).gather("complexContent/extension/sequence/element")
                     .where((e)=> e.get('name') === "tim").items;
   a[0].get('address');
   ...

