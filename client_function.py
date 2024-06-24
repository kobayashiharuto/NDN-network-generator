import importlib
import sys
import os

FUNCITON_FILE_PATH = os.environ["FUNCITON_FILE_PATH"]

def execute_function(function_name: str, args: list[bytes]):
    # ファイルのディレクトリをsys.pathに追加
    directory, module_file = os.path.split(FUNCITON_FILE_PATH)
    module_name, _ = os.path.splitext(module_file)
    sys.path.insert(0, directory)
    
    # モジュールを動的にインポート
    module = importlib.import_module(module_name)
    
    # 関数を実行
    function = getattr(module, "exec")
    result = function(function_name, args)
    return result



if __name__ == "__main__":  
    args = [b"Hello", b", ", b"world!"]
    result = execute_function("join", args)
    print(result)