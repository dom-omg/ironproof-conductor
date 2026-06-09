import { ProofService } from './services/proof'

const { privateKey, publicKey } = ProofService.generateKeyPair()

console.log('ED25519 Key Pair Generated:')
console.log(`ED25519_PRIVATE_KEY=${privateKey}`)
console.log(`ED25519_PUBLIC_KEY=${publicKey}`)
console.log('\nAdd ED25519_PRIVATE_KEY to your .env and Fly.io secrets.')
