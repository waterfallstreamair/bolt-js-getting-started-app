/*
  Update Candidate action
  1. Select "update" mode and set fields
  2. Set filters "is not empty" to fields
  3. Add script
*/

const fibery = context.getService('fibery');
const schema = await fibery.getSchema()
const typeName = args.currentEntities[0].type;
const fields = schema['typeObjects'].filter((obj) => obj.name == typeName)[0]['fieldObjects'].map((field) => field.name);
const candidate = await fibery.getEntitiesByIds(typeName, args.currentEntities.map((entity) => entity.id), fields);

const http = context.getService('http');

await http.putAsync('https://0ba8-46-98-109-3.eu.ngrok.io/api/fibery/candidate', {
    body: {
        candidate,
        type: 'update'
    },
    headers: { 'Content-type': 'application/json' }
});


/*
  Add Comment action
  1. Select "Entity linked to a Candidate" mode and select Comments
  2. Add script
*/

await http.putAsync('https://0ba8-46-98-109-3.eu.ngrok.io/api/fibery/candidate', {
    body: {
        candidate,
        type: 'add_comment'
    },
    headers: { 'Content-type': 'application/json' }
})


/*
const fibery = context.getService('fibery');

const schema = await fibery.getSchema();
const typeName = args.currentEntities[0].type;
const fields = schema['typeObjects'].filter((obj) => obj.name == typeName)[0]['fieldObjects'].map((field) => field.name);
const candidate = await fibery.getEntitiesByIds(typeName, args.currentEntities.map((entity) => entity.id), fields);

const http = context.getService('http');

await http.putAsync('https://0ba8-46-98-109-3.eu.ngrok.io/api/fibery/candidate', {
    body: {
        candidate,
        type: 'add_comment'
    },
    headers: { 'Content-type': 'application/json' }
});

*/


/*
candidate [
  {
    'hiring/name': 'Pavlo Pavlo',
    'hiring/Phone': null,
    'fibery/modification-date': '2022-09-17T15:50:52.997Z',
    'Collaboration~Documents/References': [],
    'hiring/Interviews': [],
    'fibery/id': '707fe2d0-36a0-11ed-822a-8fd4ad2185d3',
    'hiring/position': {
      Id: 'e8c7f2e0-341c-11ed-9fa9-87d0c2733ed2',
      Name: 'Middle/Middle+ Frontend'
    },
    Id: '707fe2d0-36a0-11ed-822a-8fd4ad2185d3',
    'fibery/created-by': { Name: 'kposidelov', Id: '19655419-832a-45a1-a91e-984ed4a1534d' },
    'hiring/Offer': {
      Secret: '1e101207-6e00-41c1-8ee2-2b0dae4795e8',
      Id: '734cafd1-c5b0-4a15-99e5-b87cdd26feb6'
    },
    'fibery/creation-date': '2022-09-17T15:50:23.870Z',
    'documents/documents': [],
    'Files/Files': [],
    'hiring/Type': { Id: null, Name: null },
    'hiring/Assignees': {
      Name: 'sdemakov@reaktivate.com',
      Id: 'de0e86d3-51c4-4c8b-aa33-a67fb49df345'
    },
    'fibery/public-id': '20',
    'hiring/Salary': 9999,
    'workflow/state': {
      Name: 'New',
      Final: false,
      Id: 'e31c7cf0-13ee-11e9-bcb2-5cdad52323f7'
    },
    'hiring/HR score': null,
    'hiring/Source': null,
    'hiring/Description': {
      Secret: '82beefea-5c91-4270-a967-5407eb97e442',
      Id: 'b008fe66-d1ae-4498-9fb8-559bec8cce9e'
    },
    'hiring/City': { Name: 'Lviv', Id: '66fc0d80-c232-11eb-83c9-31f86986873e' },
    'hiring/Personal Email': null,
    'fibery/rank': 1318278684225013,
    'comments/comments': [
    {
      Id: '80147e80-7cfb-4222-81af-0ac5c858c894',
      'Document Secret': 'ed0f5e71-9cc6-4ec1-8892-9b0d9a59c4a4'
    },
    {
      Id: '607cfe49-69b4-428e-a0fc-e747879693ac',
      'Document Secret': 'b2d57150-90fb-4725-a7b0-f1b1be4b6151'
    }
  ],
    'hiring/Skype': null,
    'hiring/Interview score ': null,
    'avatar/avatars': []
  }
]

*/
