Usage

```html
<div class="audio ct-audio-player">
    <audio preload="none">
        <source src="..." type="audio/mpeg">
    </audio>
</div>

<script src="audio-player.js"></script>
<script>
    player = new CtPlayer(document.querySelector(".audiopl-audio-player"));
    player.initPlayer();
</script>
```

or with jquery
```js
$('.audiopl-audio-player').each(function() {
    player = new CtPlayer(this);
    player.initPlayer();
});
```
