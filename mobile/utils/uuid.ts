const isUUIDV4 = (uuid: string) => {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  return uuidV4Regex.test(uuid);
};

export { isUUIDV4 };
