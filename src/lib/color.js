import {getCache, setCache} from "./cache";

export const hex2Rgba = (hex, opacity) => {
  return "rgba(" + parseInt("0x" + hex.slice(1, 3)) +
      "," + parseInt("0x" + hex.slice(3, 5)) +
      "," + parseInt("0x" + hex.slice(5, 7)) + ","
      + opacity + ")";
}

export const opacity = (color, opacity = 0.05) => {
  color = color === undefined ? '#ffffff' : color;
  if (color.startsWith('#')) {
    return hex2Rgba(color, opacity);
  } else if(color.split(',').length === 4) {
    return color
  } else if(color.includes('，')) {
    return 'rgba(0, 0, 0, 0)';
  }
  const tempColor = color.replace(/rgb?\(/, '')
      .replace(/\)/, '')
      .replace(/[\s+]/g, '')
      //.replace(/，/g, ',')
      .split(',');
  return `rgba(${tempColor.join(',')}, ${opacity})`;
};

export const getPresetMajorColors = () => {
  return ['rgba(0, 0, 0, 0)',
    'rgb(0, 0, 0)',
    'rgb(50, 50, 50)',
    'rgb(87, 87, 87)',
    'rgb(138, 138, 138)',
    'rgb(179, 179, 179)',
    'rgb(214, 214, 214)',
    'rgb(232, 232, 232)',
    'rgb(245, 245, 245)',
    'rgb(255, 255, 255)',
    'rgb(255, 235, 237)',
    'rgb(255, 238, 233)',
    'rgb(255, 240, 226)',
    'rgb(254, 243, 209)',
    'rgb(213, 255, 236)',
    'rgb(211, 254, 252)',
    'rgb(228, 246, 255)',
    'rgb(233, 244, 255)',
    'rgb(242, 241, 255)',
    'rgb(251, 240, 248)',
    'rgb(250, 192, 198)',
    'rgb(254, 197, 184)',
    'rgb(255, 205, 153)',
    'rgb(255, 214, 53)',
    'rgb(85, 243, 188)',
    'rgb(74, 238, 237)',
    'rgb(173, 220, 255)',
    'rgb(196, 217, 253)',
    'rgb(214, 213, 253)',
    'rgb(248, 196, 237)',
    'rgb(255, 116, 135)',
    'rgb(255, 123, 100)',
    'rgb(246, 154, 24)',
    'rgb(232, 191, 26)',
    'rgb(0, 198, 145)',
    'rgb(0, 195, 194)',
    'rgb(67, 171, 255)',
    'rgb(122, 167, 250)',
    'rgb(162, 155, 249)',
    'rgb(255, 117, 232)',
    'rgb(237, 18, 82)',
    'rgb(230, 14, 26)',
    'rgb(213, 105, 15)',
    'rgb(197, 163, 26)',
    'rgb(0, 147, 106)',
    'rgb(0, 143, 143)',
    'rgb(0, 129, 210)',
    'rgb(15, 99, 255)',
    'rgb(120, 86, 255)',
    'rgb(212, 29, 190)',
    'rgb(177, 0, 53)',
    'rgb(163, 0, 0)',
    'rgb(171, 65, 8)',
    'rgb(158, 132, 0)',
    'rgb(0, 104, 71)',
    'rgb(0, 99, 98)',
    'rgb(0, 89, 150)',
    'rgb(0, 70, 197)',
    'rgb(95, 0, 255)',
    'rgb(167, 0, 149)']
}

export const getPresetClassicalColors = () => {
  return ['rgba(0, 0, 0, 0)',
    'rgb(0, 0, 0)',
    'rgb(50, 50, 50)',
    'rgb(87, 87, 87)',
    'rgb(138, 138, 138)',
    'rgb(179, 179, 179)',
    'rgb(214, 214, 214)',
    'rgb(232, 232, 232)',
    'rgb(245, 245, 245)',
    'rgb(255, 255, 255)',
    'rgb(255, 207, 213)',
    'rgb(253, 211, 188)',
    'rgb(254, 227, 162)',
    'rgb(254, 243, 164)',
    'rgb(188, 247, 198)',
    'rgb(180, 242, 222)',
    'rgb(192, 233, 255)',
    'rgb(209, 225, 255)',
    'rgb(224, 224, 255)',
    'rgb(251, 216, 242)',
    'rgb(251, 157, 167)',
    'rgb(255, 164, 144)',
    'rgb(255, 179, 90)',
    'rgb(255, 214, 53)',
    'rgb(25, 222, 166)',
    'rgb(0, 219, 218)',
    'rgb(131, 198, 255)',
    'rgb(159, 193, 255)',
    'rgb(193, 190, 250)',
    'rgb(250, 153, 231)']
}

export const getBranchColors = () => {
  return [
   'rgb(24, 144, 255)',
   'rgb(245, 34, 45)',
  'rgb(250, 173, 20)',
   'rgb(19, 194, 194)',
  'rgb(82, 196, 26)',
  'rgb(47, 84, 235)',
  'rgb(114, 46, 209)']

}

export const  setPresetColors = (color) => {
  if(color === 'rgba(0, 0, 0, 0)') {
    return;
  }
  const colors = getCache('colors', true);
  setCache('colors', [...new Set([color].concat(colors))].slice(0, 20));
}

export const getPresetColors = () => {
  let colors = [];
  try {
    colors = getCache('colors', true) || [];
  } catch (e) {
    colors = [];
  }
  return colors
}
