// 角色清單：Sheara 用 Gemini 生成的迪士尼風人偶（臉部頭像 + 綠幕跪拜去背）
const faces = import.meta.glob('./assets/chars/*-face.webp', { eager: true, import: 'default' });
const kneels = import.meta.glob('./assets/chars/*-kneel.webp', { eager: true, import: 'default' });

const LIST = [
  ['dad', '爸爸'], ['mom', '媽媽'], ['agong', '阿公'], ['ama', '阿嬤'],
  ['kid', '國小生', 0.78], ['junior', '國中生', 0.86], ['senior', '高中生', 0.94], ['student', '女大生'],
  ['hoodie', '帽T男孩'], ['shorthair', '皮衣女孩'], ['shades', '墨鏡女孩'], ['glam', '辣妹'],
  ['engineer', '工程師'], ['finance', '金融菁英'], ['lawyer', '律師'], ['driver', '司機大哥'],
  ['pilgrim', '進香團大叔'], ['pilgrim2', '進香阿伯'], ['bajiu', '8+9'], ['taimei', '小太妹'],
  ['miaokou', '廟口少年'], ['farmer', '農夫阿伯'], ['worker', '工地大哥'], ['councilor', '議員'],
  ['boss', '大老闆'], ['mama', '孕媽咪'],
];

export const CHARS = LIST.map(([id, name, scale = 1]) => ({
  id, name, scale,
  face: faces[`./assets/chars/${id}-face.webp`],
  kneel: kneels[`./assets/chars/${id}-kneel.webp`],
}));
export const DEFAULT_CHAR = 'shades';
export const charById = (id) => CHARS.find((c) => c.id === id) || CHARS.find((c) => c.id === DEFAULT_CHAR);
