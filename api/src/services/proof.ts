import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'

ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m))

export interface ProofPayload {
  deploymentId: string
  productSlug: string
  version: string
  environmentSlug: string
  timestamp: number
  triggeredBy: string
}

export class ProofService {
  private readonly privateKey: Uint8Array
  readonly publicKeyHex: string

  constructor(privateKeyHex: string) {
    this.privateKey = ed.etc.hexToBytes(privateKeyHex)
    const pubKey = ed.getPublicKey(this.privateKey)
    this.publicKeyHex = ed.etc.bytesToHex(pubKey)
  }

  sign(payload: ProofPayload): string {
    const message = new TextEncoder().encode(JSON.stringify(payload))
    const sig = ed.sign(message, this.privateKey)
    return ed.etc.bytesToHex(sig)
  }

  verify(payload: ProofPayload, signatureHex: string, publicKeyHex: string): boolean {
    try {
      const message = new TextEncoder().encode(JSON.stringify(payload))
      const sig = ed.etc.hexToBytes(signatureHex)
      const pubKey = ed.etc.hexToBytes(publicKeyHex)
      return ed.verify(sig, message, pubKey)
    } catch {
      return false
    }
  }

  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const priv = ed.utils.randomPrivateKey()
    const pub = ed.getPublicKey(priv)
    return {
      privateKey: ed.etc.bytesToHex(priv),
      publicKey: ed.etc.bytesToHex(pub),
    }
  }
}

let _proof: ProofService | null = null

export function getProofService(): ProofService {
  if (!_proof) {
    const key = process.env.ED25519_PRIVATE_KEY
    if (!key) throw new Error('ED25519_PRIVATE_KEY not set')
    _proof = new ProofService(key)
  }
  return _proof
}
