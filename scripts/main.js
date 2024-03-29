var Munonizer = function(tracking, image, canvas, dist, clear, success, error) {
  var avg = 0; //AVRG VALUE
  var fallos = 0; //FAILS, doh
  var lastmedida = 0;
  var counter = 0;
  var est = 1;
  var drw = 1;
  // Dibujo o no dibujo
  var drawing = false;
  var ctx = canvas.getContext('2d');
  window.fastThreshold = 0.1;
  window.onload = function() {
    //se va a crear un canvas p img
    var width = image.clientWidth;
    var height = image.clientHeight;
    image.width = width;
    image.height = height;
    canvas.width = width;
    canvas.height = height;

    var doFindFeatures = function() {
      tracking.Fast.THRESHOLD = window.fastThreshold;
      ctx.drawImage(image, 0, 0, width, height);
      // $(image).hide();

      var imageData = ctx.getImageData(0, 0, width, height);
      var gray = tracking.Image.grayscale(imageData.data, width, height);
      var corners = tracking.Fast.findCorners(gray, width, height);

      var sides = []; //nalg
      var d1;
      var d2;
      ctx.fillStyle = '#4772B2';

      //Nucleo del algoritmo, compara distancias en I y J (costados arriba y abajo)
      for (var i = 0; i < corners.length; i += 2) {
        d1 = distance(
          corners[i],
          corners[i + 1],
          corners[i + 2],
          corners[i + 3]
        );

        for (var j = 0; j < 200; j += 2) {
          d2 = distance(
            corners[i],
            corners[i + 1],
            corners[j + 2],
            corners[j + 3]
          );

          ctx.fillStyle = '#f00';
          ctx.fillRect(corners[i], corners[i + 1], 3, 3);

          if (d1 === d2 && d2 >= 8 && d2 <= 90) {
            //FILTRO RUIDO si las distancias son chicas, no se toman
            //console.log(d1 + "," + d2);
            sides.push(d1);
          }
        }
      }

      console.log('Cada linea mide de 0,5 cm ' + avg + ' pixeles');

      var newArr = sides.slice().sort(),
        most = [undefined, 0],
        counter = 0;

      newArr.reduce(function(old, chr) {
        //encuentro el valor mas repetido
        old === chr
          ? ++counter > most[1] && (most = [chr, counter])
          : (counter = 1);
        return chr;
      });
      console.log(most[0]);
      avg = most[0];
      console.log(most[1]);
      return most[1];
    };
    // Cordenadas X, Y corners[i], corners[i + 1]

    for (var threshold = 1; threshold <= 12; threshold++) {
      if (doFindFeatures() >= 14) {
        success();
        break;
      } else {
        error();

        window.fastThreshold = window.fastThreshold + 0.5;
        doFindFeatures();
        fallos = fallos + 1;
        if (fallos >= 10) {
          console.log('SAFE TRIGGER');
          break;
        }
      }
    }
  };

  function distance(pointx1, pointy1, pointx2, pointy2) {
    var dist = Math.pow(pointx1 - pointx2, 2) + Math.pow(pointy1 - pointy2, 2); // raiz((a-b)^2 + (c-d)^2)
    dist = Math.sqrt(dist); //Por temas de performance se descomenta, cuando se hacia en la misma tarda mucho
    return dist;
  }

  (function() {
    // Get a regular interval for drawing to the screen
    window.requestAnimFrame = (function() {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })();
    // Canvas
    ctx.strokeStyle = '#4772B2';
    ctx.lineWith = 3;
    // UI
    // $(".clearBtn").click(clearCanvas);
    var mousePos = { x: 0, y: 0 };
    var firstPos = mousePos;
    var lastPos = mousePos;
    canvas.addEventListener(
      'mousedown',
      function(e) {
        if (ctx) {
          if (drw) {
            drw = 0;
          } else {
            drawing = true;
          } //No dibujo por primera vez.

          if (est) {
            firstPos = getMousePos(canvas, e);
            console.log(firstPos);
            est = 0;
          } else {
            lastPos = getMousePos(canvas, e);
            renderCanvas();

            est = 1;
          }
        }
      },
      false
    );
    // Eventos para touch
    canvas.addEventListener(
      'touchstart',
      function(e) {
        mousePos = getTouchPos(canvas, e);
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );
    canvas.addEventListener(
      'touchend',
      function() {
        var mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );
    // No deja scrollear cuando tocas
    document.body.addEventListener(
      'touchstart',
      function(e) {
        if (e.target === canvas) {
          e.preventDefault();
        }
      },
      false
    );
    document.body.addEventListener(
      'touchend',
      function(e) {
        if (e.target === canvas) {
          e.preventDefault();
        }
      },
      false
    );
    document.body.addEventListener(
      'touchmove',
      function(e) {
        if (e.target === canvas) {
          e.preventDefault();
        }
      },
      false
    );

    // posicion mouse
    function getMousePos(canvasDom, mouseEvent) {
      var rect = canvasDom.getBoundingClientRect();
      return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
      };
    }

    // posicion de touch en canvas
    function getTouchPos(canvasDom, touchEvent) {
      var rect = canvasDom.getBoundingClientRect();
      return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
      };
    }

    // dibujar en canvas
    function renderCanvas() {
      if (drawing) {
        if (!est) {
          ctx.beginPath();
          ctx.moveTo(firstPos.x, firstPos.y);
          ctx.lineTo(lastPos.x, lastPos.y);
          ctx.strokeStyle = '#4772b2';
          ctx.lineWidth = 3;
          ctx.stroke();
          var a = Math.pow(Math.abs(lastPos.x - firstPos.x), 2);
          var b = Math.pow(Math.abs(lastPos.y - firstPos.y), 2);
          var c = Math.sqrt(Math.abs(a + b));
          var medida = (c * 0.5) / avg;

          if (medida !== lastmedida) {
            console.log('Distancia lateral=' + medida);
            switch (counter) {
              case 0:
                dist(0, medida.toFixed(2));
                counter = 1;
                break;
              case 1:
                dist(1, medida.toFixed(2));
                counter = 2;
                break;
              case 2:
                dist(2, medida.toFixed(2));
                counter = 0;
                ctx = null;
                break;

              default:
            }
            lastmedida = medida;
          }
        }
      }
    }
  })();

  function clearCanvas(e) {
    e.preventDefault();
    counter = 0;
    lastmedida = 0;
    est = 1;
    drw = 1;
    drawing = false;
    ctx = canvas.getContext('2d');
    // $(image).show();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    // $(image).hide();

    clear();
  }
};

var image = document.getElementById('image');
var canvas = document.getElementById('cphoto');

Munonizer(
  tracking,
  image,
  canvas,
  function(index, val) {
    document.getElementById('printmed' + index).value = val;

    // var paso = parseInt(index + 1);
    // $("#stepnumber").text(paso + 1);
    // if (paso === 1) {
    //     $(".paso1").hide();
    //     $(".paso2").show();
    // }
    // if (paso === 2) {
    //     $(".paso2").hide();
    //     $(".paso3").show();
    // }
    // if (paso === 3) {
    //     $(".paso3").hide();
    //     $(".paso4").show();
    // }
  },
  function() {},
  function() {
    console.log('OK');
  },
  function() {
    console.log('NOT OK');
  }
);
