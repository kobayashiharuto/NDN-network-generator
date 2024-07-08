import os
import shutil

from utils.read_network_relations_from_csv import read_network_relations_from_csv
from utils.docker_compose_generator import NodeInfoForDockerCompose, docker_compose_generator
from utils.nlsr_config_generator import nlsr_config_generator

# ネットワーク関係のCSVファイルのパス
NETWORK_RELATIONS_PATH = './config/network_relations.csv'

# docker-compose.yml に使う dockerfile のパス
DOCKERFILE_PATH = './config/dockerfile'

# Dockerfileのコピー元パス
DOCKERFILE_ORIGIN_PATH = './config/dockerfile'

# requirements.txt のコピー元パス
REQUIREMENTS_PATH = './config/requirements.txt'

# 生成したファイルを保存するパスたち
GENERATE_DIR = './generated'
DOCKER_COMPOSE_PATH = GENERATE_DIR + '/docker-compose.yml'
NLSR_CONFIG_DIR = GENERATE_DIR + '/nlsr'                          

# ファイルを生成して実行します
def main():
    # 生成先のディレクトリを作成、あるいはすでに存在する場合は削除して作り直す
    if os.path.exists(GENERATE_DIR):
        shutil.rmtree(GENERATE_DIR)
    os.makedirs(NLSR_CONFIG_DIR)

    # ネットワーク関係を読み込む
    relations = read_network_relations_from_csv(NETWORK_RELATIONS_PATH)
    print(relations)
    
    # NLSR設定ファイルを生成
    for node, neighbors in relations.items():
        nlsr_config = nlsr_config_generator(my_node_name=node, neighbors=neighbors)
        with open(f'{NLSR_CONFIG_DIR}/{node}.conf', 'w') as f:
            f.write(nlsr_config)
    
    # Docker Compose ファイルを生成
    node_infos = []
    for node in relations.keys():
        node_infos.append(NodeInfoForDockerCompose(
            node_name=node,
            environments={
                'FUNCITON_FILE_PATH': f'/workspaces/config/function/{node}.py',
                'NLSR_CONFIG_FILE_PATH': f'/workspaces/generated/nlsr/{node}.conf'
            },
            command='bash -c " ./shell/restart.sh && ./shell/auto_nlsr.sh 1 && tail -f /dev/null"'
        ))
    
    docker_compose = docker_compose_generator(node_infos)
    with open(DOCKER_COMPOSE_PATH, 'w') as f:
        f.write(docker_compose)

    # Dockerfile を docker-compose.yml と同じディレクトリにコピー
    shutil.copy(DOCKERFILE_ORIGIN_PATH, GENERATE_DIR)

    # requirements.txt を docker-compose.yml と同じディレクトリにコピー
    shutil.copy(REQUIREMENTS_PATH, GENERATE_DIR)
    
    # 生成結果のログ、ファイル一覧を日本語で表示
    print('生成が完了しました。')
    print('以下のファイルが生成されました。')
    print(f'  - {DOCKER_COMPOSE_PATH}')
    for nlsr_config_file in os.listdir(NLSR_CONFIG_DIR):
        print(f'  - {NLSR_CONFIG_DIR}/{nlsr_config_file}')

    # 生成したディレクトリにて、docker compose up --build を実行
    os.chdir(GENERATE_DIR)
    os.system('docker-compose up --build')
    

if __name__ == '__main__':
    main()