/*
 * Copyright 2021 Chaos Mesh Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { Box, Button, Grid, Grow, Modal, useTheme } from '@mui/material'
import { Confirm, setAlert, setConfirm } from 'slices/globalStatus'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import { Event } from 'api/events.type'
import { EventHandler } from 'cytoscape'
import EventsTimeline from 'components/EventsTimeline'
import NodeConfiguration from 'components/ObjectConfiguration/Node'
import Paper from '@ui/mui-extends/esm/Paper'
import PaperTop from '@ui/mui-extends/esm/PaperTop'
import Space from '@ui/mui-extends/esm/Space'
import { WorkflowSingle } from 'api/workflows.type'
import api from 'api'
import { constructWorkflowTopology } from 'lib/cytoscape'
import i18n from 'components/T'
import loadable from '@loadable/component'
import { makeStyles } from '@mui/styles'
import { useIntervalFetch } from 'lib/hooks'
import { useIntl } from 'react-intl'
import { useStoreDispatch } from 'store'
import yaml from 'js-yaml'

const YAMLEditor = loadable(() => import('components/YAMLEditor'))

const useStyles = makeStyles((theme) => ({
  root: {},
  configPaper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '75vw',
    height: '90vh',
    padding: 0,
    transform: 'translate(-50%, -50%)',
    [theme.breakpoints.down('lg')]: {
      width: '90vw',
    },
  },
}))

const Single = () => {
  const classes = useStyles()
  const intl = useIntl()
  const navigate = useNavigate()
  const theme = useTheme()
  const { uuid } = useParams()

  const dispatch = useStoreDispatch()

  const [single, setSingle] = useState<WorkflowSingle>()
  const [data, setData] = useState<any>()
  const [selected, setSelected] = useState<'workflow' | 'node'>('workflow')
  const modalTitle = selected === 'workflow' ? single?.name : selected === 'node' ? data.name : ''
  const [configOpen, setConfigOpen] = useState(false)
  const topologyRef = useRef<any>(null)

  const [events, setEvents] = useState<Event[]>([])

  const fetchWorkflowSingle = (intervalID?: number) =>
    api.workflows
      .single(uuid!)
      .then(({ data }) => {
        // TODO: remove noise in API
        data.kube_object.metadata.annotations &&
          delete data.kube_object.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration']

        setSingle(data)

        // Clear interval after workflow succeed
        if (data.status === 'finished') {
          clearInterval(intervalID)
        }
      })
      .catch(console.error)

  useIntervalFetch(fetchWorkflowSingle)

  useEffect(() => {
    if (single) {
      const topology = topologyRef.current!

      if (typeof topology === 'function') {
        topology(single)

        return
      }

      const { updateElements } = constructWorkflowTopology(topologyRef.current!, single, theme, handleNodeClick)

      topologyRef.current = updateElements
    }

    const fetchEvents = () => {
      api.events
        .cascadeFetchEventsForWorkflow(uuid!, { limit: 999 })
        .then(({ data }) => setEvents(data))
        .catch(console.error)
        .finally(() => {
          // setLoading(false)
        })
    }

    if (single) {
      fetchEvents()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [single])

  const onModalOpen = () => setConfigOpen(true)
  const onModalClose = () => setConfigOpen(false)

  const handleSelect = (selected: Confirm) => () => dispatch(setConfirm(selected))

  const handleAction = (action: string) => () => {
    let actionFunc: any

    switch (action) {
      case 'archive':
        actionFunc = api.workflows.del

        break
      default:
        actionFunc = null
    }

    if (actionFunc) {
      actionFunc(uuid)
        .then(() => {
          dispatch(
            setAlert({
              type: 'success',
              message: i18n(`confirm.success.${action}`, intl),
            })
          )

          if (action === 'archive') {
            navigate('/workflows')
          }
        })
        .catch(console.error)
    }
  }

  const handleNodeClick: EventHandler = (e) => {
    const node = e.target
    const { template: nodeTemplate } = node.data()
    const template = single?.kube_object.spec.templates.find((t: any) => t.name === nodeTemplate)

    setData(template)
    setSelected('node')

    onModalOpen()
  }

  return (
    <>
      <Grow in={true} style={{ transformOrigin: '0 0 0' }}>
        <div>
          <Space spacing={6} className={classes.root}>
            <Space direction="row">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArchiveOutlinedIcon />}
                onClick={handleSelect({
                  title: `${i18n('archives.single', intl)} ${single?.name}`,
                  description: i18n('workflows.deleteDesc', intl),
                  handle: handleAction('archive'),
                })}
              >
                {i18n('archives.single')}
              </Button>
            </Space>
            <Paper sx={{ display: 'flex', flexDirection: 'column', height: 450 }}>
              <PaperTop
                title={
                  <Space spacing={1.5} alignItems="center">
                    <Box>{i18n('workflow.topology')}</Box>
                  </Space>
                }
              ></PaperTop>
              <div ref={topologyRef} style={{ flex: 1 }} />
            </Paper>

            <Grid container>
              <Grid item xs={12} lg={6} sx={{ pr: 3 }}>
                <Paper sx={{ display: 'flex', flexDirection: 'column', height: 600 }}>
                  <PaperTop title={i18n('events.title')} boxProps={{ mb: 3 }} />
                  <Box flex={1} overflow="scroll">
                    <EventsTimeline events={events} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} lg={6} sx={{ pl: 3 }}>
                <Paper sx={{ height: 600, p: 0 }}>
                  {single && (
                    <Space display="flex" flexDirection="column" height="100%">
                      <PaperTop title={i18n('common.definition')} boxProps={{ p: 4.5, pb: 0 }} />
                      <Box flex={1}>
                        <YAMLEditor
                          name={single.name}
                          data={yaml.dump({
                            apiVersion: 'chaos-mesh.org/v1alpha1',
                            kind: 'Workflow',
                            ...single.kube_object,
                          })}
                          download
                        />
                      </Box>
                    </Space>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Space>
        </div>
      </Grow>

      <Modal open={configOpen} onClose={onModalClose}>
        <div>
          <Paper
            className={classes.configPaper}
            sx={{ width: selected === 'workflow' ? '50vw' : selected === 'node' ? '70vw' : '50vw' }}
          >
            {single && configOpen && (
              <Space display="flex" flexDirection="column" height="100%">
                <PaperTop title={modalTitle} boxProps={{ p: 4.5, pb: 0 }} />
                <Box display="flex" flex={1}>
                  {selected === 'node' && (
                    <Box width="50%">
                      <NodeConfiguration template={data} />
                    </Box>
                  )}
                  <YAMLEditor name={modalTitle} data={yaml.dump(data)} />
                </Box>
              </Space>
            )}
          </Paper>
        </div>
      </Modal>
    </>
  )
}

export default Single
