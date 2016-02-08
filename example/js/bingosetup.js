function bingosetup() {
     $('.popout').click(function() {
        var mode = null;
        var line = $(this).attr('id');
        var name = $(this).html();
        var items = [];
        var cells = $('#bingo .'+ line);
        for (var i = 0; i < 5; i++) {
          items.push($(cells[i]).html());
        };
        window.open('popout.html#'+ name +'='+ items.join(';;;'),"_blank","toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=220, height=460");
    });
  
    $("#bingo tr td:not(.popout), #selected td").toggle(
        function () {
          $(this).addClass("greensquare");
        },
        function () {
          $(this).addClass("redsquare").removeClass("greensquare");
        },
        function () {
          $(this).removeClass("redsquare");
        }
    
  );
  
    $("#row1").hover(function() { $(".row1").addClass("hover"); }, function() {	$(".row1").removeClass("hover"); });
    $("#row2").hover(function() { $(".row2").addClass("hover"); }, function() {	$(".row2").removeClass("hover"); });
    $("#row3").hover(function() { $(".row3").addClass("hover"); }, function() {	$(".row3").removeClass("hover"); });
    $("#row4").hover(function() { $(".row4").addClass("hover"); }, function() {	$(".row4").removeClass("hover"); });
    $("#row5").hover(function() { $(".row5").addClass("hover"); }, function() {	$(".row5").removeClass("hover"); });

    $("#col1").hover(function() { $(".col1").addClass("hover"); }, function() {	$(".col1").removeClass("hover"); });
    $("#col2").hover(function() { $(".col2").addClass("hover"); }, function() {	$(".col2").removeClass("hover"); });
    $("#col3").hover(function() { $(".col3").addClass("hover"); }, function() {	$(".col3").removeClass("hover"); });
    $("#col4").hover(function() { $(".col4").addClass("hover"); }, function() {	$(".col4").removeClass("hover"); });
    $("#col5").hover(function() { $(".col5").addClass("hover"); }, function() {	$(".col5").removeClass("hover"); });

    $("#tlbr").hover(function() { $(".tlbr").addClass("hover"); }, function() {	$(".tlbr").removeClass("hover"); });
    $("#bltr").hover(function() { $(".bltr").addClass("hover"); }, function() {	$(".bltr").removeClass("hover"); });

    var initialOpts = {
        seed: getUrlParameter('seed') || Math.ceil(999999 * Math.random()).toString(),
        mode: getUrlParameter('mode') || 'normal',
        lang: getUrlParameter('lang') || 'name'
    };

    var prettyMode = {
        'normal': 'Normal',
        'short': 'Short',
        'long': 'Long'
    };

    var bingoFunc = ootBingoGenerator;

    // if debug was requested, initialize all of the debug panels
    if (getUrlParameter('debug')) {
        $("#info-panel").hide();
        var $debugPanel = $("#debug-panel");
        $debugPanel.show();

        $("#generate-random").on("click", function() {
            generateCard(undefined);
        });

        $("#generate-with-seed").on("click", function() {
            var seed = "" + $("#seed-field").val();
            generateCard(seed);
        });

        $debugPanel.find("#row-info tr").each(function() {
            var rowClass = $(this).attr("row-class");
            var $row = $("." + rowClass);

            $(this).hover(function() {
                $row.addClass("hover");
            }, function() {
                $row.removeClass("hover");
            });
        });

        // fill in the difficulties of the goals if they're not set already
        if (!bingoList[1][0].difficulty) {
            for (var difficulty = 1; difficulty <= 25; difficulty++) {
                for (var i = 0; i < bingoList[difficulty].length; i++) {
                    bingoList[difficulty][i].difficulty = difficulty;
                }
            }
        }
    }

    generateCard(initialOpts.seed);

    function generateCard(seed) {
        // make a copy of the initial options to use as a base
        var opts = JSON.parse(JSON.stringify(initialOpts));

        if (!seed) {
            Math.seedrandom(new Date().getTime());
            seed = Math.ceil(999999 * Math.random()).toString();
        }
        opts.seed = seed;

        var bingoBoard = bingoFunc(bingoList, opts);

        if (bingoBoard) {
            setBoard(bingoBoard);

            var cardType = prettyMode[opts.mode];
            $("#results-footer").html("<p>OoT Bingo <strong>" + bingoList["info"].version + "</strong>&emsp;Seed: <strong>" +
                opts.seed + "</strong>&emsp;Card type: <strong>" + cardType + "</strong></p>");
        }
        else {
            alert("Card could not be generated");
        }

        if (getUrlParameter("debug")) {
            var bingoGenerator = new BingoGenerator(bingoList, opts);
            bingoGenerator.bingoBoard = bingoBoard;
            setDebugInfo(bingoGenerator);
        }
    }

    function setBoard(board) {
        for (i=1; i<=25; i++) {
            $('#slot'+i).html(board[i].name);
        }
    }

    function setDebugInfo(bingoGenerator) {
        var bingoBoard = bingoGenerator.bingoBoard;

        $debugPanel.find("#board-seed").html(bingoGenerator.seed);
        $debugPanel.find("#max-allowed-synergy").html(bingoGenerator.maximumSynergy);
        $debugPanel.find("#max-allowed-spill").html(bingoGenerator.maximumSpill);
        $debugPanel.find("#failed-iterations").html(bingoBoard.meta.iterations);

        var $rowTableBody = $debugPanel.find("#row-info tbody");
        if (bingoBoard) {
            for (var row in INDICES_PER_ROW) {
                var rowSynergy = bingoGenerator.evaluateRow(row);

                var rowSquares = bingoGenerator.getOtherSquares(row);
                var rowRawTime = BASELINE_TIME;
                for (var i = 0; i < rowSquares.length; i++) {
                    rowRawTime += rowSquares[i].goal.difficulty;
                }

                var rowEffectiveTime = rowRawTime - rowSynergy;

                var rowCell = '<td class="centered">' + row + "</td>";
                var rawTimeCell = '<td class="raw-time-cell centered">'+ rowRawTime + "</td>";
                var synergyCell = '<td class="synergy-cell centered">'+ rowSynergy + "</td>";
                var rowEffTimeCell = '<td class="effective-time-cell centered">' + rowEffectiveTime + "</td>";
                $rowTableBody.find("#debug-row-" + row).html(rowCell + rawTimeCell + synergyCell + rowEffTimeCell);
            }

            var $synergyCells = $rowTableBody.find(".synergy-cell");
            var synergies = $synergyCells.map(function() { return +$(this).text(); }).toArray();
            var minSynergy = Math.min.apply(null, synergies);
            var maxSynergy = Math.max.apply(null, synergies);
            var deltaSynergy = maxSynergy - minSynergy;

            $synergyCells.each(function() {
                var synergy = +$(this).text();
                var fraction = (synergy - minSynergy) / deltaSynergy;
                $(this).css("color", generateColor(fraction));
            });

            var $rawTimeCells = $rowTableBody.find(".raw-time-cell");
            var rawTimes = $rawTimeCells.map(function() { return +$(this).text(); }).toArray();
            var minRawTime = Math.min.apply(null, rawTimes) - 1;
            var maxRawTime = Math.max.apply(null, rawTimes) + 1;
            var deltaRawTime = maxRawTime - minRawTime;

            $rawTimeCells.each(function() {
                var rawTime = +$(this).text();
                var fraction = (rawTime - minRawTime) / deltaRawTime;
                fraction = 1 - fraction;
                $(this).css("color", generateColor(fraction));
            });
        }

        function generateColor(fraction) {
            var hue = 120 * fraction;
            return "hsl(" + hue + ", 50%, 50%)";
        }
    }
}

$(bingosetup);
