# infiro

Infiro 是一个基于 [lilac](https://github.com/archlinuxcn/lilac) 构建的 Arch Linux 第三方软件仓库，提供 Arch Linux 官方仓库以及 [archlinuxcn] 仓库未收录的软件包。

## 快速开始

### 1. 导入并信任签名密钥

```bash
sudo pacman-key --recv-keys 136AC8B87D0FEFA8 --keyserver keys.openpgp.org
sudo pacman-key --lsign-key 136AC8B87D0FEFA8

# 安装密钥环
sudo pacman -Syu infiro-keyring
```

## 贡献

本仓库使用 [lilac](https://github.com/archlinuxcn/lilac) 自动化构建和更新。贡献方式：

1. Fork 本仓库
2. 添加或修改软件包（参考 [Arch Linux PKGBUILD 文档](https://wiki.archlinux.org/title/PKGBUILD)）
3. 提交 Pull Request

提交信息格式：`<包目录名>: <简要描述>`

更多细节请参阅 [AGENTS.md](./AGENTS.md)。

## 致谢

- [Arch Linux](https://archlinux.org/)
- [archlinuxcn/lilac](https://github.com/archlinuxcn/lilac)
