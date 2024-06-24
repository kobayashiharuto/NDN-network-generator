def exec(functionName: str, args: list[bytes]) -> bytes:
  if functionName == 'join':
    return b''.join(args)
  else:
    raise Exception('Function not found')
