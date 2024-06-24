import asyncio
import importlib
import sys
import os
from typing import Optional
from ndn.app import NDNApp
from ndn.encoding import Name, InterestParam, BinaryStr, FormalName, MetaInfo
import logging

from utils import extract_first_level_args, extract_my_function_name, is_function_request, send_interest_process

logging.basicConfig(format='[{asctime}]{levelname}:{message}',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    level=logging.INFO,
                    style='{')


FUNCITON_FILE_PATH = os.environ["FUNCITON_FILE_PATH"]

def execute_function(function_name: str, args: list[bytes]) -> bytes:
    # ファイルのディレクトリをsys.pathに追加
    directory, module_file = os.path.split(FUNCITON_FILE_PATH)
    module_name, _ = os.path.splitext(module_file)
    sys.path.insert(0, directory)
    
    # モジュールを動的にインポート
    module = importlib.import_module(module_name)

    print(f"モジュールをインポートしました: {module}")
    
    # 関数を実行
    function = getattr(module, "exec")
    result = function(function_name, args)

    return result

app = NDNApp()

@app.route('/nodeA')
def on_interest(name: FormalName, param: InterestParam, _app_param: Optional[BinaryStr]):
    print(f'>> I: {Name.to_str(name)}, {param}')
    async def async_on_interest():
        # function リクエストでない場合は、データリクエストとして処理
        if not is_function_request(name):
            content = "nodeA!".encode()
            app.put_data(name, content=content, freshness_period=10000)
            return

        # function リクエストの場合は、まず第一階層の引数を抽出
        args = extract_first_level_args(name)

        # それぞれを interest で並列でリクエストし、データを集める
        async def fetch_content(arg):
            return await send_interest_process(arg)
        tasks = [fetch_content(arg) for arg in args]
        contents = await asyncio.gather(*tasks)

        print(f"データが集まりました: {contents}")

        # 自身の関数名を取得 
        my_function_name = extract_my_function_name(name)

        print(f"Function名: {my_function_name}")

        # 関数を実行
        result = execute_function(my_function_name, contents)

        print(f"実行結果: {result}")

        # 結果を返す
        app.put_data(name, content=result, freshness_period=10000)

    # 現在のイベントループを取得
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # イベントループがすでに走っている場合はタスクとしてスケジュール
        loop.create_task(async_on_interest())
    else:
        # イベントループが走っていない場合はrunで実行
        loop.run_until_complete(async_on_interest())


if __name__ == "__main__":  
    app.run_forever()