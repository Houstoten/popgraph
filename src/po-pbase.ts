import { BigInt, ipfs, json } from "@graphprotocol/graph-ts"

import {
  POPbase,
  Approval,
  ApprovalForAll,
  OwnershipTransferred,
  Transfer
} from "../generated/POPbase/POPbase"

import {ConnectionNFT, User} from '../generated/schema'

export function handleTransfer(event: Transfer): void {
  let connectionNFT = ConnectionNFT.load(event.params.tokenId.toString())

  if(!connectionNFT) {
    connectionNFT = new ConnectionNFT(event.params.tokenId.toString())
    connectionNFT.creator = event.transaction.from.toHexString()
    connectionNFT.tokenID = event.params.tokenId;
    connectionNFT.createdAtTimestamp = event.block.timestamp;

    const popBaseContract = POPbase.bind(event.address)
    connectionNFT.contentURI = popBaseContract.tokenURI(event.params.tokenId)
    connectionNFT.metadataURI = popBaseContract.tokenURI(event.params.tokenId)
  }

  const ipfsData = ipfs.cat(connectionNFT.metadataURI.split("/").at(-1))

  if(ipfsData){
    const jsonIpfsData = json.fromBytes(ipfsData).toObject()

    const name = jsonIpfsData.get("name") 
    if(name !== null) {
      connectionNFT.name = name.toString()
    }

    const description = jsonIpfsData.get("description") 
    if(description !== null) {
      connectionNFT.description = description.toString()
    }

    const image = jsonIpfsData.get("image") 
    if(image !== null) {
      connectionNFT.image = image.toString()
    }
  }
  connectionNFT.owner = event.params.to.toHexString()
  connectionNFT.save()

  let fromUser = User.load(event.transaction.from.toHexString())
  if(!fromUser) {
    fromUser = new User(event.transaction.from.toHexString())
    fromUser.save()
  }

  let toUser = User.load(event.params.to.toHexString())
  if(!toUser) {
    toUser = new User(event.params.to.toHexString())
    toUser.save()
  }
  
}
