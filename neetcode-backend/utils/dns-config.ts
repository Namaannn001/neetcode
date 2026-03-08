import dns from 'node:dns';

// Force IPv4 for all DNS lookups
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}