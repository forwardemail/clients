import { ApiService } from "../../../../abstractions/api.service";
import { Utils } from "../../../../misc/utils";

import { Forwarder } from "./forwarder";
import { ForwarderOptions } from "./forwarder-options";

export class ForwardEmailForwarder implements Forwarder {
  async generate(apiService: ApiService, options: ForwarderOptions): Promise<string> {
    if (options.apiKey == null || options.apiKey === "") {
      throw "Invalid Forward Email API key.";
    }
    if (options.forwardemail?.domain == null || options.forwardemail.domain === "") {
      throw "Invalid Forward Email domain.";
    }
    const requestInit: RequestInit = {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authorization: "Basic " + Utils.fromUtf8ToB64(options.apiKey + ":"),
        "Content-Type": "application/json",
      }),
    };
    const url = `https://api.forwardemail.net/v1/domains/${options.forwardemail.domain}/aliases`;
    requestInit.body = JSON.stringify({
      labels: options.website,
      description:
        (options.website != null ? "Website: " + options.website + ". " : "") +
        "Generated by Bitwarden.",
    });
    const request = new Request(url, requestInit);
    const response = await apiService.nativeFetch(request);
    if (response.status === 200 || response.status === 201) {
      const json = await response.json();
      return json?.name + "@" + (json?.domain?.name || options.forwardemail.domain);
    }
    if (response.status === 401) {
      throw "Invalid Forward Email API key.";
    }
    const json = await response.json();
    if (json?.message != null) {
      throw "Forward Email error:\n" + json.message;
    }
    if (json?.error != null) {
      throw "Forward Email error:\n" + json.error;
    }
    throw "Unknown Forward Email error occurred.";
  }
}
