import { fs, path, yaml } from './utils';
import { clashConfigDir, clashDefaultConfigPath, configPath } from './const';

export const clashDefaultConfig = `#---------------------------------------------------#
## 配置文件需要放置在 $HOME/.config/clash/*.yaml

## 这份文件是clashX的基础配置文件，请尽量新建配置文件进行修改。
## ！！！只有这份文件的端口设置会随ClashX启动生效

## 如果您不知道如何操作，请参阅 官方Github文档 https://github.com/Dreamacro/clash/blob/dev/README.md
#---------------------------------------------------#

# (HTTP and SOCKS5 in one port)
mixed-port: 7890
# RESTful API for clash
external-controller: 127.0.0.1:9090
allow-lan: false
mode: rule
log-level: warning

proxies:

proxy-groups:

rules:
  - DOMAIN-SUFFIX,google.com,DIRECT
  - DOMAIN-KEYWORD,google,DIRECT
  - DOMAIN,google.com,DIRECT
  - DOMAIN-SUFFIX,ad.com,REJECT
  - GEOIP,CN,DIRECT
  - MATCH,DIRECT
`;

export const copyDefaultConfig = async () => {
  if (await fs.pathExists(clashDefaultConfigPath)) return;
  await fs.writeFile(clashDefaultConfigPath, clashDefaultConfig);
};

export const initConfig = async () => {
  const files = (await fs.readdir(clashConfigDir)).filter(it => /^[^.].+\.ya?ml$/.test(it));
  const config = await getConfig();
  config.list = config.list.filter(it => files.includes(it.name));
  const names = config.list.map(it => it.name);
  const added = files.filter(it => !names.includes(it)).map(it => ({ name: it, updateTime: 0 }));
  config.list.push(...added);
  config.list.some(it => it.name === config.selected) || (config.selected = config.list[0].name);
  return setConfig(config);
};

export const getConfig = async () => {
  if (await fs.pathExists(configPath)) {
    return yaml.load((await fs.readFile(configPath)).toString()) as Config;
  } else {
    return <Config>{
      selected: '',
      updateInterval: 86400,
      autoSetProxy: true,
      list: []
    };
  }
};
export const setConfig = async (config: Config) => {
  console.log('setConfig');
  console.time('setConfig');
  await fs.writeFile(configPath, yaml.dump(config));
  console.timeEnd('setConfig');
  return config;
};

export const getClashConfig = async (name: string) => {
  return yaml.load((await fs.readFile(path.join(clashConfigDir, name))).toString());
};

export const getApiInfo = async (): Promise<Record<'host' | 'port' | 'secret', string>> => {
  console.log('getApiInfo');
  console.time('getApiInfo');
  const { selected } = await getConfig();
  const clashConfig = (await getClashConfig(selected)) as any;
  const _extCtl = clashConfig?.['external-controller'] || '127.0.0.1:9090';
  const secret = clashConfig?.secret || '';
  const [host, port] = _extCtl.split(':');
  console.timeEnd('getApiInfo');
  return { host: host === '0.0.0.0' ? '127.0.0.1' : host, port, secret };
};
