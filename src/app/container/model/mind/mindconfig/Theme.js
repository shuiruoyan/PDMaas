import React, {useMemo, useState} from 'react';
import {SimpleTab} from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';

export default React.memo(({getMind}) => {
    const currentPrefix = getPrefix('container-model-mind-config-theme');
    const imgBase = './asset/mind/themes/';
    const themeMap = {
        default: `${imgBase}default.jpg`,
        classic: `${imgBase}classic.jpg`,
        minions: `${imgBase}minions.jpg`,
        pinkGrape: `${imgBase}pinkGrape.jpg`,
        mint: `${imgBase}mint.jpg`,
        gold: `${imgBase}gold.jpg`,
        vitalityOrange: `${imgBase}vitalityOrange.jpg`,
        greenLeaf: `${imgBase}greenLeaf.jpg`,
        dark2: `${imgBase}dark2.jpg`,
        skyGreen: `${imgBase}skyGreen.jpg`,
        classic2: `${imgBase}classic2.jpg`,
        classic3: `${imgBase}classic3.jpg`,
        classic4: `${imgBase}classic4.jpg`,
        classicGreen: `${imgBase}classicGreen.jpg`,
        classicBlue: `${imgBase}classicBlue.jpg`,
        blueSky: `${imgBase}blueSky.jpg`,
        brainImpairedPink: `${imgBase}brainImpairedPink.jpg`,
        dark: `${imgBase}dark.jpg`,
        earthYellow: `${imgBase}earthYellow.jpg`,
        freshGreen: `${imgBase}freshGreen.jpg`,
        freshRed: `${imgBase}freshRed.jpg`,
        romanticPurple: `${imgBase}romanticPurple.jpg`,
        simpleBlack: `${imgBase}simpleBlack.jpg`,
        courseGreen: `${imgBase}courseGreen.jpg`,
        coffee: `${imgBase}coffee.jpg`,
        redSpirit: `${imgBase}redSpirit.jpg`,
        blackHumour: `${imgBase}blackHumour.jpg`,
        lateNightOffice: `${imgBase}lateNightOffice.jpg`,
        blackGold: `${imgBase}blackGold.jpg`,
        autumn: `${imgBase}autumn.jpg`,
        avocado: `${imgBase}avocado.jpg`,
        orangeJuice: `${imgBase}orangeJuice.jpg`,
        oreo: `${imgBase}oreo.jpg`,
        shallowSea: `${imgBase}shallowSea.jpg`,
        lemonBubbles: `${imgBase}lemonBubbles.jpg`,
        rose: `${imgBase}rose.jpg`,
        seaBlueLine: `${imgBase}seaBlueLine.jpg`,
        neonLamp: `${imgBase}neonLamp.jpg`,
        darkNightLceBlade: `${imgBase}darkNightLceBlade.jpg`,
        morandi: `${imgBase}morandi.jpg`,
        classic5: `${imgBase}classic5.jpg`,
        dark3: `${imgBase}dark3.jpg`,
        dark4: `${imgBase}dark4.jpg`,
        cactus: `${imgBase}cactus.jpg`,
        classic6: `${imgBase}classic6.jpg`,
        classic7: `${imgBase}classic7.jpg`,
    };
    const [theme, setTheme] = useState(() => {
        const mind = getMind();
        return mind.getTheme();
    });
    const groupList = useMemo(() => {
        const themeList = [

            {
                name: '奥利奥',
                value: 'oreo',
                dark: false,
            },
            {
                name: '浅海',
                value: 'shallowSea',
                dark: false,
            },
            {
                name: '柠檬气泡',
                value: 'lemonBubbles',
                dark: false,
            },
            {
                name: '玫瑰',
                value: 'rose',
                dark: false,
            },
            {
                name: '海蓝线',
                value: 'seaBlueLine',
                dark: false,
            },
            {
                name: '霓虹灯',
                value: 'neonLamp',
                dark: true,
            },
            {
                name: '暗夜冰刃',
                value: 'darkNightLceBlade',
                dark: true,
            },
            {
                name: '莫兰迪',
                value: 'morandi',
                dark: false,
            },
            {
                name: '脑图经典5',
                value: 'classic5',
                dark: false,
            },
            {
                name: '暗色3',
                value: 'dark3',
                dark: true,
            },
            {
                name: '暗色4',
                value: 'dark4',
                dark: true,
            },
            {
                name: '仙人掌',
                value: 'cactus',
                dark: false,
            },
            {
                name: '脑图经典6',
                value: 'classic6',
                dark: false,
            },
            {
                name: '脑图经典7',
                value: 'classic7',
                dark: false,
            },
            {
                name: '默认',
                value: 'default',
                dark: false,
            },
            {
                name: '暗色2',
                value: 'dark2',
                dark: true,
            },
            {
                name: '天清绿',
                value: 'skyGreen',
                dark: false,
            },
            {
                name: '脑图经典2',
                value: 'classic2',
                dark: false,
            },
            {
                name: '脑图经典3',
                value: 'classic3',
                dark: false,
            },
            {
                name: '经典绿',
                value: 'classicGreen',
                dark: false,
            },
            {
                name: '经典蓝',
                value: 'classicBlue',
                dark: false,
            },
            {
                name: '天空蓝',
                value: 'blueSky',
                dark: false,
            },
            {
                name: '脑残粉',
                value: 'brainImpairedPink',
                dark: false,
            },
            {
                name: '暗色',
                value: 'dark',
                dark: true,
            },
            {
                name: '泥土黄',
                value: 'earthYellow',
                dark: false,
            },
            {
                name: '清新绿',
                value: 'freshGreen',
                dark: false,
            },
            {
                name: '清新红',
                value: 'freshRed',
                dark: false,
            },
            {
                name: '浪漫紫',
                value: 'romanticPurple',
                dark: false,
            },
            {
                name: '粉红葡萄',
                value: 'pinkGrape',
                dark: false,
            },
            {
                name: '薄荷',
                value: 'mint',
                dark: false,
            },
            {
                name: '金色vip',
                value: 'gold',
                dark: false,
            },
            {
                name: '活力橙',
                value: 'vitalityOrange',
                dark: false,
            },
            {
                name: '绿叶',
                value: 'greenLeaf',
                dark: false,
            },
            {
                name: '脑图经典',
                value: 'classic',
                dark: true,
            },
            {
                name: '脑图经典4',
                value: 'classic4',
                dark: false,
            },
            {
                name: '小黄人',
                value: 'minions',
                dark: false,
            },
            {
                name: '简约黑',
                value: 'simpleBlack',
                dark: false,
            },
            {
                name: '课程绿',
                value: 'courseGreen',
                dark: false,
            },
            {
                name: '咖啡',
                value: 'coffee',
                dark: false,
            },
            {
                name: '红色精神',
                value: 'redSpirit',
                dark: false,
            },
            {
                name: '黑色幽默',
                value: 'blackHumour',
                dark: true,
            },
            {
                name: '深夜办公室',
                value: 'lateNightOffice',
                dark: true,
            },
            {
                name: '黑金',
                value: 'blackGold',
                dark: true,
            },
            {
                name: '牛油果',
                value: 'avocado',
                dark: false,
            },
            {
                name: '秋天',
                value: 'autumn',
                dark: false,
            },
            {
                name: '橙汁',
                value: 'orangeJuice',
                dark: true,
            },
        ];
        const baiduThemes = [
            'default',
            'skyGreen',
            'classic2',
            'classic3',
            'classicGreen',
            'classicBlue',
            'blueSky',
            'brainImpairedPink',
            'earthYellow',
            'freshGreen',
            'freshRed',
            'romanticPurple',
            'pinkGrape',
            'mint',
        ];
        const baiduList = [];
        const classicsList = [];
        themeList.forEach((item) => {
            if (baiduThemes.includes(item.value)) {
                baiduList.push(item);
            } else if (!item.dark) {
                classicsList.push(item);
            }
        });
        return [
            {
                name: '经典',
                list: classicsList,
            },
            {
                name: '深色',
                list: themeList.filter((item) => {
                    return item.dark;
                }),
            },
            {
                name: '朴素',
                list: baiduList,
            },
        ];
    }, []);
    const updateTheme = (value) => {
        const mind = getMind();
        mind.setThemeConfig({}, true);
        mind.setTheme(value);
        setTheme(value);
        mind.emit('theme_ui_change', value);
    };
    return <div className={currentPrefix}>
      <SimpleTab
        options={groupList.map((g) => {
          return {
              key: g.name,
              content: <div className={`${currentPrefix}-list`}>
                {
                      g.list.map((t) => {
                          return <div
                            onClick={() => updateTheme(t.value)}
                            className={classesMerge({
                              [`${currentPrefix}-list-item`]: true,
                              [`${currentPrefix}-list-item-active`]: theme === t.value,
                          })}>
                            <div>
                              <img alt='' src={themeMap[t.value]}/>
                            </div>
                            <div>{t.name}</div>
                          </div>;
                      })
                  }
              </div>,
              title: g.name,
          };
      })}
    /></div>;
});
