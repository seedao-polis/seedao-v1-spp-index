## 1. ERC20 Token

- SCR

#### 1.1 `Transfer` Event

- Method: POST
- Json Request Body

```json
{
  "contractName": "SCR",
  "contractAddress": "0xc74DEE15a4700D5df797bDD3982EE649A3Bb8c6C",
  "event": "Transfer",
  "data": [
    {
      "metadata": {
        "blockNumber": 17342523,
        "timestamp": 1685094971,
        "tx": "0x1044bb97305bdd2b3284943a5f054574014a68322462f25884ba31351e9cf1bf"
      },
      "parameters": {
        "from": "0x0000000000000000000000000000000000000000",
        "to": "0x01175Ef4738b825cd12F4d1ff2d2904d52144531",
        "value": "389135.9"
      }
    }
  ]
}
```

- `data[0].parameters.value` is a string type, but its real value is a float
- `data[0].parameters.value` is divided by the Token's decimal, you can use directly.

## 2. ERC721 Token

- SEED

#### 2.1 `Transfer` Event

- Method: POST
- Json Request Body

```json
{
  "contractName": "SEED",
  "contractAddress": "0x30093266E34a816a53e302bE3e59a93B52792FD4",
  "event": "Transfer",
  "data": [
    {
      "metadata": {
        "blockNumber": 18447135,
        "timestamp": 1697809632,
        "tx": "0x5a97de18565138c77cbafe96afc661c9ba7bc32db9336b744831047d86bd4ca8"
      },
      "parameters": {
        "from": "0x15DE3d7f7180f554421A91e27eE28a542881740D",
        "to": "0x78f625A65Fc316D32d98d249b698fb509A6d98f2",
        "tokenId": "215"
      }
    }
  ]
}
```

- `data[0].parameters.tokenId` is string type

## 3. ERC1155 Token

- NODE
- EnsoulSBT
- Onboarding
- MscSBT

#### 3.1 `Transfer` Event

- Method: POST
- Json Request Body

```json
{
  "contractName": "MscSBT",
  "contractAddress": "0x2C436d61C5Af62bcbfeE40B1f0BE5B483DfA0E11",
  "event": "Transfer",
  "data": [
    {
      "metadata": {
        "blockNumber": 33656501,
        "timestamp": 1664337714,
        "tx": "0x81a9cc5cc5dd42afba712cef5ac4140d473bbcd403c521c5b8c45797be6770da"
      },
      "parameters": {
        "operator": "0x095E8a343ec8Cb2f8b3568aeAF7b31342550Ad20",
        "from": "0x0000000000000000000000000000000000000000",
        "to": "0xE68B28e5f00fcD1b28Cc70bCC7aAD4c38bFcb3A5",
        "ids": ["167"],
        "values": ["1"]
      }
    }
  ]
}
```

- `data[0].parameters.ids` is string array
- `data[0].parameters.values` is string array

## 4. Custom Contract

#### 4.1 SNS

##### 4.1.1 `Transfer` Event

- Method: POST
- Json Request Body

```json
{
  "contractName": "SeeDAORegistrarController",
  "contractAddress": "0x6C679D0ca8C6e3692Ca033fab499242A94C257C2",
  "event": "Transfer",
  "data": [
    {
      "metadata": {
        "blockNumber": 4526514,
        "timestamp": 1697809632,
        "tx": "0x257f128885dee85064fa302219ae29e683e0c32e02f403cc0886b13a36e9d920"
      },
      "parameters": {
        "from": "0x0000000000000000000000000000000000000000",
        "to": "0x7D53BA1D70a66D572A90E3e80Ad4253769340EE7",
        "tokenId": "0x783d42a7ccb843f29a3a60580f9b86a8959cc025a498028a0e60707efe249e11",
        "sns": "munan.seedao"
      }
    }
  ]
}
```

- `data[0].parameters.tokenId` is string type
