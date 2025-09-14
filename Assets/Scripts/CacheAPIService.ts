export interface WordCombination {
  word_a: string;
  word_b: string;
  word_c: string;
}

export interface AssetData {
  word_c: string;
  asset_filename: string;
  asset_download_url: string;
}

export interface APIResponse<T> {
  found: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const cacheAPIUrl = "https://htn25-v2.max-jiang.com";

export class CacheAPIService {
  private static instance: CacheAPIService;
  private baseUrl: string = cacheAPIUrl;
  private rsm = require("LensStudio:RemoteServiceModule") as RemoteServiceModule;
  private im = require("LensStudio:InternetModule") as InternetModule;

  private constructor() {}

  public static getInstance(): CacheAPIService {
    if (!CacheAPIService.instance) {
      CacheAPIService.instance = new CacheAPIService();
    }
    return CacheAPIService.instance;
  }

  /**
   * Query if a word combination exists
   */
  public async queryCombination(wordA: string, wordB: string): Promise<APIResponse<WordCombination>> {
    try {
      const request = new Request(
        `${this.baseUrl}/query_combination`,
        {
          method: "POST",
          body: JSON.stringify({
            word_a: wordA,
            word_b: wordB
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const response = await this.im.fetch(request, null);
      const data = await response.json();
      print(JSON.stringify(response, null, 2));
      print(JSON.stringify(data, null, 2));
      
      return data as APIResponse<WordCombination>;
    } catch (error) {
      print(`Error querying combination: ${error}`);
      return {
        found: false,
        error: `Network error: ${error}`
      };
    }
  }

  /**
   * Query if a 3D asset exists for a word
   */
  public async queryAsset(wordC: string): Promise<APIResponse<AssetData>> {
    try {
      const request = new Request(
        `${this.baseUrl}/query_asset`,
        {
          method: "POST",
          body: JSON.stringify({
            word_c: wordC
          }),
          headers: {
            "Content-Type": "application/json"
          },
        }
      );
      const response = await this.im.fetch(request, null);
      const data = await response.json();
      print(JSON.stringify(response, null, 2));
      print(JSON.stringify(data, null, 2));
      
      return data as APIResponse<AssetData>;
    } catch (error) {
      print(`Error querying asset: ${error}`);
      return {
        found: false,
        error: `Network error: ${error}`
      };
    }
  }

  /**
   * Update a word combination
   */
  public async updateCombination(wordA: string, wordB: string, wordC: string): Promise<APIResponse<WordCombination>> {
    try {
      const request = new Request(
        `${this.baseUrl}/update_combination`,
        {
          method: "POST",
          body: JSON.stringify({
            word_a: wordA,
            word_b: wordB,
            word_c: wordC
          }),
          headers: {
            "Content-Type": "application/json"
          },
        }
      );

      const response = await this.im.fetch(request, null);
      const data = await response.json();
      
      return data as APIResponse<WordCombination>;
    } catch (error) {
      print(`Error updating combination: ${error}`);
      return {
        found: false,
        error: `Network error: ${error}`
      };
    }
  }

  /**
   * Update a 3D asset for a word using a link with raw asset data
   */
  public async updateAsset(wordC: string, assetUrl: string): Promise<APIResponse<AssetData>> {
    try {
      print(`🔄 Updating asset for word: ${wordC} from URL: ${assetUrl}`);
      
      // First, fetch the raw asset data from the URL
      const assetData = await this.fetchAssetDataFromUrl(assetUrl);
      
      if (!assetData) {
        return {
          found: false,
          error: `Failed to fetch asset data from URL: ${assetUrl}`
        };
      }
      
      const request = new Request(
        `${this.baseUrl}/update_asset`,
        {
          method: "POST",
          body: JSON.stringify({
            word_c: wordC,
            asset_data: assetData
          }),
          headers: {
            "Content-Type": "application/json"
          },
        }
      );

      const response = await this.im.fetch(request, null);
      const data = await response.json();
      print(`✅ Successfully updated asset for word: ${wordC}`);
      print(JSON.stringify(data, null, 2));
      
      return data as APIResponse<AssetData>;
    } catch (error) {
      print(`❌ Error updating asset: ${error}`);
      return {
        found: false,
        error: `Network error: ${error}`
      };
    }
  }

  private async fetchAssetDataFromUrl(url: string): Promise<string> {
    try {
      const request = new Request(url);
      const response = await this.im.fetch(request, null);
      // @ts-ignore: arrayBuffer may not be typed on Response, but is available at runtime
      const bytes = await response.bytes();
      return Base64.encode(bytes);
    } catch (error) {
      print(`Error fetching asset data: ${error}`);
      return "";
    }
  }
}
