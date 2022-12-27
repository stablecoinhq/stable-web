# stable-web

Web application

## Development

Run a command below and open [http://localhost:3000](http://localhost:3000) with your browser.

```bash
yarn dev
```

### ローカル開発環境

Goerliのチェーンをローカルにてフォークすることで開発を進めることができる。

1. Metamaskにてlocalhost:8545のネットワークを追加する。[ネットワーク追加画面](chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#settings/networks/add-network)にて以下のように設定する。

| Name               | Description           |
|--------------------|-----------------------|
| Network name       | Localhost 8545        |
| New RPC URL        | http://localhost:8545 |
| Chain ID           | 31337                 |
| Currency symbol    | ETH                   |
| Block explorer URL |                       |

1. InfuraのAPIキーを取得する。鍵は(https://app.infura.io/dashboard)にて取得できる。
2. APIキーを取得したら`.env.local`ファイルを作成し、以下のように鍵を設定する

```
INFURA_API_KEY=ここに取得したInfuraのAPIキーを挿入する
```

3. 設定したら`npm run node`を実行する。これでGoerliのチェーンをローカルにフォークしてくれる。

4. 3.を実行した際に以下のように秘密鍵一覧が表示されるはずなので、どれか1つを選んでMetamaskにてインポートする。インポートするにはMetamask画面右上にあるアイコンを押した上で、`Import Account`を選択する。

```terminal
WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

![スクリーンショット 2022-12-01 16 25 16](https://user-images.githubusercontent.com/15665039/204991708-ba09d09f-80ac-4a05-9fb0-95b6a39b7ede.png)

5. これでstable-webはローカル開発環境のチェーンを利用できるようになる。

### Nonceのリセット

たまにノンスがズレてトランザクションが正常に取り込まれないケースが発生する。その場合はMetamaskにてアカウントの初期化を行う(これによって秘密鍵が失われることはない)。

1. Metamaskの右上アイコンを押す
2. Settingsを選択する
3. Advancedを選択する
4. Reset Accountを選択する

![スクリーンショット 2022-12-01 16 36 47](https://user-images.githubusercontent.com/15665039/204993842-815a300d-734a-418b-beb8-2fd68dd663d6.png)
