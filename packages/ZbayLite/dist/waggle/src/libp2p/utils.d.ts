/// <reference types="node" />
import { Certificate } from 'pkijs';
export declare function dumpPEM(tag: string, body: string | Certificate | CryptoKey): Buffer;
