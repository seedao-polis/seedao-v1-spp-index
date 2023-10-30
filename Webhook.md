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
        
      },
      "parameters": {
        "from": "0x0000000000000000000000000000000000000000",
        "to": "0x78f625A65Fc316D32d98d249b698fb509A6d98f2",
        "value": "949436"
      }
    },
    {
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x8C913aEc7443FE2018639133398955e0E17FB0C1",
      "value": "733522"
    }
  ]
}
```

> `value` is divided by the Token's decimal, you can use directly.

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
  "blockNumber": 18360511,
  "data": [
    {
      "from": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "to": "0x4d4b78D37090eD3e1EAe6779bA2C3D6728052915",
      "tokenId": "119"
    },
    {
      "from": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "to": "0x4d4b78D37090eD3e1EAe6779bA2C3D6728052915",
      "tokenId": "121"
    }
  ]
}
```

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
  "contractName": "NODE",
  "contractAddress": "0x9d34D407D8586478b3e4c39BE633ED3D7be1c80c",
  "event": "Transfer",
  "data": [
    {
      "operator": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "from": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "to": "0x4d4b78D37090eD3e1EAe6779bA2C3D6728052915",
      "ids": ["119", "122"],
      "values": [1, 2]
    },
    {
      "operator": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "from": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "to": "0x4d4b78D37090eD3e1EAe6779bA2C3D6728052915",
      "ids": ["119", "122"],
      "values": [1, 2]
    }
  ]
}
```

## 4. Custom Contract

#### 4.1 SNS

##### 4.1.1 `Transfer` Event

- Method: POST
- Json Request Body

```json
{
  "contractName": "SEED",
  "contractAddress": "0x30093266E34a816a53e302bE3e59a93B52792FD4",
  "event": "Transfer",
  "blockNumber": 18360511,
  "data": [
    {
      "from": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "to": "0x4d4b78D37090eD3e1EAe6779bA2C3D6728052915",
      "tokenId": "234242347865754654234165475676575",
      "snsName": "abc.seedao"
    },
    {
      "from": "0x82944b68bB92fA11764041AA61204b5fdC85F429",
      "to": "0x4d4b78D37090eD3e1EAe6779bA2C3D6728052915",
      "tokenId": "234242342134324324234165475676575",
      "snsName": "def.seedao"
    }
  ]
}
```
