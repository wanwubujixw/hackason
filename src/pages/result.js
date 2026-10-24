/**
 * 推荐结果页 + 回信卡渲染（B 模块）
 *
 * 只负责把数据渲染成 DOM，不处理业务逻辑；
 * 点击等交互由 home.js 传入回调完成。
 */

/**
 * 渲染场景推荐列表
 * @param {HTMLElement} container - 承载列表的容器
 * @param {Array} scenes          - matchScenes / getFallbackScenes 返回的场景数组
 * @param {(scene: Object) => void} onSelect - 用户点选某个场景时的回调
 */
function renderSceneList(container, scenes, onSelect) {
  container.innerHTML = scenes.map(scene => `
    <button type="button" class="scene-card" data-scene-id="${scene.id}">
      <span class="scene-type">${scene.type}</span>
      <span class="scene-name">${scene.name}</span>
      <span class="scene-desc">${scene.description}</span>
      <span class="scene-reason"><strong>为什么推荐：</strong>${scene.reason}</span>
      <span class="scene-action">👉 ${scene.smallAction}</span>
    </button>
  `).join("");

  container.querySelectorAll(".scene-card").forEach(card => {
    card.addEventListener("click", () => {
      const scene = scenes.find(item => item.id === card.dataset.sceneId);
      if (scene) {
        onSelect(scene);
      }
    });
  });
}

/**
 * 渲染一张回信卡
 * @param {HTMLElement} container - 回信卡容器
 * @param {Object} letter         - generateLetterSafe 返回的 Letter 对象
 */
function renderLetterCard(container, letter) {
  container.innerHTML = `
    <div class="letter-stamp" aria-hidden="true">💌</div>
    <p class="letter-content">${letter.content}</p>
    <dl class="letter-meta">
      <div>
        <dt>📍 推荐地点</dt>
        <dd>${letter.place}</dd>
      </div>
      <div>
        <dt>📝 为什么是这里</dt>
        <dd>${letter.reason}</dd>
      </div>
      <div>
        <dt>👉 现在就能做的小事</dt>
        <dd>${letter.smallAction}</dd>
      </div>
    </dl>
    <p class="letter-ending">${letter.ending}</p>
  `;
}

export { renderSceneList, renderLetterCard };
