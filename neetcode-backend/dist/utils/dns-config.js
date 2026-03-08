"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_dns_1 = __importDefault(require("node:dns"));
// Force IPv4 for all DNS lookups
if (node_dns_1.default.setDefaultResultOrder) {
    node_dns_1.default.setDefaultResultOrder('ipv4first');
}
