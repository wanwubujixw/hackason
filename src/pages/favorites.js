/**
 * 收藏列表页渲染（B 模块）
 *
 * 只负责把 getFavorites() 返回的数据渲染成 DOM，
 * 取消收藏由 home.js 传入的回调完成。
 */

/**
 * 把 ISO 时间格式化成 "2026/10/23 14:05"
 * @param {string} isoString
 * @returns {string}
 */
function formatSavedAt(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 渲染收藏列表
 * @param {HTMLElement} container - 收藏列表容器
 * @param {Array} items           - getFavorites() 返回的数组
 * @param {(item: Object) => void} onRemove - 点「取消收藏」时的回调
 */
function renderFavorites(container, items, onRemove) {
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>还没有收藏的回信</p>
        <p class="empty-hint">收到喜欢的回信时，点一下「收藏」就会出现在这里。</p>
      </div>`;
    return;
  }

  container.innerHTML = items.map((item, index) => `
    <article class="favorite-item">
      <p class="favorite-meta">
        <span>${item.place ? `📍 ${item.place}` : "💌 校园回信"}</span>
        <span>${formatSavedAt(item.savedAt)}</span>
      </p>
      <p class="favorite-content">${item.letterContent}</p>
      <button type="button" class="btn btn-ghost favorite-remove" data-index="${index}">取消收藏</button>
    </article>
  `).join("");

  container.querySelectorAll(".favorite-remove").forEach(button => {
    button.addEventListener("click", () => {
      const item = items[Number(button.dataset.index)];
      if (item) {
        onRemove(item);
      }
    });
  });
}

export { renderFavorites };
