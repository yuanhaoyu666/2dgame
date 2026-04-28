Wandering Samurai Demo
一个基于 Vite + Canvas 的 2D 横版平台动作闯关 Demo。当前版本以“先完整跑通，再逐步打磨”为目标，包含横版移动、跳跃、翻滚、近战、弓箭、敌人 AI、安全房间、商店、传送门、Boss 战和通关/失败流程。

运行方式
安装依赖：

npm install
启动开发服务器：

npm run dev
浏览器打开：

http://127.0.0.1:5173/
打包：

npm run build
预览打包结果：

npm run preview
操作说明
A / D：左右移动
Space：跳跃
Shift：翻滚/冲刺闪避，期间短暂无敌
鼠标左键 / J：普通攻击
鼠标右键 / K：弓箭远程攻击
E：互动、进入传送门、爬梯、商店/回血点交互
P：跳到下一关，调试用
F2：显示/隐藏 sprite 和碰撞盒调试信息
当前玩法流程
玩家从第 1 关开始，向右推进。
击败区域内敌人，或推进到关卡目标区域。
传送门开启后按 E 进入安全房间。
在安全房间中可以回血、购买武器，然后进入下一关。
第 4 关为 Boss 关，击败鬼面将军后显示胜利界面。
玩家 HP 归零后显示失败界面，可以重新开始。
已实现内容
横版平台移动、跳跃、下落、碰撞和镜头跟随
土狼时间、跳跃缓冲、翻滚无敌
普通攻击和弓箭远程攻击
体力、生命、金币和当前武器 UI
敌人受击闪烁、击退、伤害数字、粒子和屏幕震动
胖小怪、妖狼、鬼面将军 Boss
第 1 关四层小楼、爬梯和可破坏箱子
第 2 关断桥与高台
第 3 关废弃城镇
第 4 关 Boss 竞技场
安全房间、商人、回血点和下一关传送门
玩家、妖狼、Boss 的 sprite 动画接入
敌人 sprite 与碰撞盒分离
项目结构
src/
  main.js                  # 游戏入口
  styles.css               # 页面与 Canvas 样式
  entities/
    Player.js              # 玩家移动、跳跃、攻击、受伤逻辑
    Enemy.js               # 敌人 AI、攻击、技能、受伤逻辑
  systems/
    Game.js                # 主循环、关卡流程、战斗结算、商店交互
    Input.js               # 键盘和鼠标输入
    LevelManager.js        # 关卡、地形、敌人出生点、安全房间
    utils.js               # 碰撞和工具函数
  ui/
    Renderer.js            # Canvas 绘制、背景、sprite、UI、调试显示
  data/
    playerAnimations.js    # 玩家动画配置
    enemyAnimations.js     # 敌人动画配置
    projectiles.js         # 弓箭等投射物资源配置
    weapons.js             # 武器和商店商品配置
  assets/
    player/                # 玩家 soldier sprite
    enemies/
      fat/                 # 胖小怪 sprite
      wolf/                # 妖狼 sprite
      boss/                # 鬼面将军 sprite
    projectiles/           # 箭矢等投射物贴图
    backgrounds/           # 预留背景资源
    tiles/                 # 预留地形资源
    ui/                    # 预留 UI 资源
Sprite 配置说明
玩家动画配置在：

src/data/playerAnimations.js
敌人动画配置在：

src/data/enemyAnimations.js
Boss 和妖狼目前使用“一行动画图”，每张图从左到右排列多帧。配置项主要包括：

image：资源路径
frameCount：帧数
frameDuration：每帧时长
loop：是否循环
scale：绘制缩放
offsetX / offsetY：贴图相对碰撞盒的偏移
如果贴图位置不对，优先调整对应动画配置里的 scale、offsetX、offsetY。碰撞盒仍在 Enemy.js 或关卡敌人参数里控制，不要直接用贴图尺寸当碰撞盒。

关卡编辑位置
关卡数据集中在：

src/systems/LevelManager.js
这里可以调整：

地图宽度
玩家出生点
地形和平台
箱子、断桥、墙体
装饰物
爬梯目标点
敌人出生点和巡逻范围
传送门位置
后续可做
给普通敌人拆分更干净的单行动画图
增加玩家跳跃/下落专用动画
修复代码里部分中文字符串的编码显示问题
增加音效和背景音乐
做更细的攻击关键帧与敌人硬直
增加开始菜单和关卡选择界面
