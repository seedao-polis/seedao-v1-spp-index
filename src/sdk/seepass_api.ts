import axios from 'axios';

export const chunkArrayEveryN = (arr: Array<any>, size: number) => {
  var chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export interface UserChainData {
  wallet: string;
  chainId: number;
  contractAddr: string;
  contractType: string;
  amount: string;
  tokenId: string;
  tokenUri: string;

  collectionName?: string;
  tokenTitle?: string;
  symbol?: string;
  imageUri?: string;
  metadata?: string;
}

const MAX_BATCH_SIZE = 50;

export class SeepassAPI {
  private base: string;
  constructor(_base: string) {
    this.base = _base;
  }

  // updateSocialAccounts send requests to update social accounts with given user wallet
  async updateSocialAccounts() { }

  // batchUpdateUserChainAssets send multiple user chain asset records to API in one request
  async batchUpdateUserChainAssets(payload: UserChainData[]) {
    const apiEndpoint = `${this.base}/data_srv/batch_update_user_chain_record`;
    const chunkedRecords = chunkArrayEveryN(payload, MAX_BATCH_SIZE);
    console.log(`batchUpdateUserChainAssets: chunk size: ${chunkedRecords.length}`);
    process.stdout.write("processing: ");
    try {
      for (let i = 0; i < chunkedRecords.length; i++) {
        process.stdout.write(`${i}...`);
        await axios.post(apiEndpoint, chunkedRecords[i]);
      }
      process.stdout.write(`DONE\n`);
    } catch (error: unknown) {
      throw new Error(`Error sending data: ${error}`);
    }
  }

  // batchUpdateNftMetadata update metadata and other fields in user_chain_asset table, no wallet is used in this request
  async batchUpdateNftMetadata(payload: UserChainData[]) {
    const apiEndpoint = `${this.base}/data_srv/batch_update_nft_metadata`;
    const chunkedRecords = chunkArrayEveryN(payload, MAX_BATCH_SIZE);
    try {
      for (let i = 0; i < chunkedRecords.length; i++) {
        await axios.post(apiEndpoint, chunkedRecords[i]);
      }
    } catch (error: unknown) {
      throw new Error(`Error sending data: ${error}`);
    }
  }
}
