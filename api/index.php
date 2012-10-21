<?php

header('Content-type: application/json');
mysql_connect('localhost', 'root', '');
mysql_select_db('frontbone');
$db_host = 'mysql52.hoster.ru';
$db_name = 'db71456m';
$db_user = 'm71456';
$db_pw = '9eAYuqMC';
//mysql_connect($db_host, $db_user, $db_pw);
//mysql_select_db($db_name);
if ($_REQUEST['method'] == 'PUT')
{
	$method = 'PUT';
}
else
{
	$method = $_SERVER['REQUEST_METHOD'];
}
if ($_SERVER['REQUEST_METHOD'] == 'PUT'&&false)
{
	$putdata = fopen("php://input", "r");
	$str = '';

	/* Read the data 1 KB at a time
	  and write to the file */
	while ($data = fread($putdata, 1024))
		$str.=$data;
	parse_str($str, $arr);
	$_REQUEST = array_replace($_REQUEST, $arr);
}
/*
  $method = 'read';
  if ($_REQUEST['method'])
  {
  $method = $_REQUEST['method'];
  } */

switch ($method)
{
	case 'POST':

		$query = mysql_query("INSERT INTO `cars` (
`id` ,
`amount` ,
`color`
)
VALUES (
NULL , '{$_REQUEST['amount']}', '{$_REQUEST['color']}'
);");
		echo json_encode(mysql_insert_id());
		break;
	case 'PUT':

		$query = mysql_query("UPDATE `cars` SET `amount` = '{$_REQUEST['amount']}',
`color` = '{$_REQUEST['color']}' WHERE `cars`.`id` ='{$_REQUEST['id']}' LIMIT 1 ;");
		echo json_encode($query);
		break;
	case 'GET':
		if (!$_REQUEST['id'])
		{
			$query = mysql_query('SELECT * FROM cars ORDER BY `id`');
			$result = array();

			while ($row = mysql_fetch_assoc($query))
			{
				array_push($result, $row);
			}
			echo json_encode($result);
		}
		else
		{
			$query = mysql_query("SELECT * FROM cars WHERE `id`='{$_REQUEST['id']}'");
			$row = mysql_fetch_assoc($query);
			echo json_encode($row);
		}
		break;

	case 'DELETE':

		$query = mysql_query("DELETE FROM `cars` WHERE `cars`.`id` = '{$_REQUEST['id']}' LIMIT 1");
		echo json_encode($query);
	default:
		break;
}

