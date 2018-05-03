export default function assetIdValidator(user, aids) {
  for(let i=0; i<aids.length; i++) {
    if (!isFinite(aids[i])) {
      return {
        error: true,
        code: 'inv1004',
        message: 'Asset IDs must be valid asset IDs.',
        data: null
      };
    }
    
    if (user.inTradeInventory && user.inTradeInventory.indexOf(aids[i]) !== -1) {
      return {
        error: true,
        code: 'inv1005',
        message: 'Some of the asset IDs are already in trade.',
        data: null
      };
    }
  }
  
  return true;
}
  