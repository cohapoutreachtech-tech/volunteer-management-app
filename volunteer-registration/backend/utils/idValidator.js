function isValidSalesforceId(id) {
  if (!id || typeof id !== 'string') return false;
  const s = id.trim();
  return /^[A-Za-z0-9]{15}$/.test(s) || /^[A-Za-z0-9]{18}$/.test(s);
}

module.exports = { isValidSalesforceId };
