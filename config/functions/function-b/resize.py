def exec(self, args: list[bytes]) -> None:
  # 引数全てを結合して1つの文字列にする
  name = b''.join(args).decode()
  return name