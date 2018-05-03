export default function userValidator(user, data) {
    if (user.token !== data.token) {
      return {
        error: true,
        code: 'inv1000',
        message: 'Security token mismatch.',
        data: null
      };
    }
    
    if (user.id !== data.data.sid) {
      return {
        error: true,
        code: 'inv1001',
        message: 'Cannot validate the user.',
        data: null
      };
    }
    
    if (user.tradeUrlToken !== data.data.tradeUrlToken) {
      return {
        error: true,
        code: 'inv1002',
        message: 'Trade url token mismatch. Please update trade URL and re-login if you have recently changed the trade URL.',
        data: null
      };
    }
    
    if (!user.tradeUrl) {
      return {
        error: true,
        code: 'inv1003',
        message: 'We cannot find your trade URL. Please set your trade URL first to proceed.',
        data: null
      };
    }
    
    return true;
}
  