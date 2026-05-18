export const getGlobalStyle = (C) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:${C.grey50};color:${C.grey800};transition:background .2s,color .2s;}
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:${C.grey100};}
  ::-webkit-scrollbar-thumb{background:${C.tealM};border-radius:3px;}
  input,select,textarea{font-family:'DM Sans',sans-serif;color-scheme:${C.isDark?"dark":"light"};}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
`;
