-module(main).
-export([start/1, start/2]).


start(TestFileName) ->
    TestDB = readlines(TestFileName),
    TestDB.


start(TrainFileName, TestFileName) ->
    TrainDB = readlines(TrainFileName),
    TestDB = readlines(TestFileName),
    {TrainDB, TestDB}.


readlines(FileName) ->
  {ok, Device} = file:open(FileName, [read]),
  Lines = get_line(Device, []),
  file:close(Device),
  Flowers = lists:map(fun line_to_flower/1, Lines),
  Flowers.


get_line(Device, List) ->
  case file:read_line(Device) of
    {ok, Data} -> get_line(Device, lists:append([Data], List));
    eof -> List;
    {error, Reason} -> io:format("Error: ~p~n", [Reason])
  end.


line_to_flower(Line) ->
    {Params, [ClassString]} = lists:split(4, string:tokens(Line," ")),
    {ok, MP} = re:compile("\\n"),
    Class = re:replace(ClassString, MP, "", [global,{return,list}]),
    [SepalLengh, SepalWidth, PetalLengh, PetalWidth] = [ list_to_float(X)|| X <- Params],
    {SepalLengh, SepalWidth, PetalLengh, PetalWidth, Class}.

